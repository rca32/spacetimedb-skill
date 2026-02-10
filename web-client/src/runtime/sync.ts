import { Entity } from 'koota'
import { DbConnection } from '../module_bindings'
import { IsLocalPlayer, Position } from '../core/traits'
import { RuntimeContext, RuntimeModule } from './types'

const MOVE_SPEED = 5.5
const SEND_INTERVAL_SECONDS = envNumber('VITE_SYNC_SEND_INTERVAL_SECONDS', 0.08)
const MAX_FEEDBACK_KEYS = 4096
const MAX_PENDING_MOVES = 128
const PENDING_TIMEOUT_MS = 2_000
const LERP_THRESHOLD_METERS = envNumber('VITE_SYNC_LERP_THRESHOLD_METERS', 0.3)
const SNAP_THRESHOLD_METERS = envNumber('VITE_SYNC_SNAP_THRESHOLD_METERS', 2.5)
const MIN_CORRECTION_MS = envNumber('VITE_SYNC_MIN_CORRECTION_MS', 120)
const MAX_CORRECTION_MS = envNumber('VITE_SYNC_MAX_CORRECTION_MS', 220)
const MAX_ACCEPTED_CORRECTION_DISTANCE = envNumber('VITE_SYNC_MAX_ACCEPTED_CORRECTION_DISTANCE', 1.2)
const MAX_ACCEPTED_CORRECTION_MS = envNumber('VITE_SYNC_MAX_ACCEPTED_CORRECTION_MS', 360)
const SPEED_SMOOTHING = envNumber('VITE_SYNC_SPEED_SMOOTHING', 0.25)
const SPEED_ADAPT_START_MPS = envNumber('VITE_SYNC_SPEED_ADAPT_START_MPS', 2.5)
const SPEED_ADAPT_MAX_MPS = envNumber('VITE_SYNC_SPEED_ADAPT_MAX_MPS', 7.5)
const SPEED_ADAPT_MAX_EXTRA_MS = envNumber('VITE_SYNC_SPEED_ADAPT_MAX_EXTRA_MS', 140)
const SPEED_ADAPT_MAX_LERP_SCALE = envNumber('VITE_SYNC_SPEED_ADAPT_MAX_LERP_SCALE', 1.5)
const REQUIRED_STABLE_ACCEPTED_FEEDBACKS = envInt('VITE_SYNC_STABLE_REQUIRED_FEEDBACKS', 3, 1, 8)
const STABLE_ACCEPTED_POSITION_DELTA_METERS = envNumber('VITE_SYNC_STABLE_POSITION_DELTA_METERS', 0.35)
const REQUEST_ID_MAX_LENGTH = 64
const BOOT_NONCE = Math.floor(Math.random() * 0xffff_ffff)
const BOOT_NONCE_STR = BOOT_NONCE.toString(36)

interface Vec3 {
  x: number
  y: number
  z: number
}

interface PendingMove {
  requestId: string
  sentAtMs: number
}

interface ActiveCorrection {
  origin: Vec3
  target: Vec3
  startedAtMs: number
  durationMs: number
}

type PlayerMovementFeedbackRow = {
  requestKey: string
  identity: unknown
  requestId: string
  accepted: boolean
  reasonCode: string
  serverX: number
  serverY: number
  serverZ: number
}

type PlayerSessionViewRow = {
  identity: unknown
  regionId: bigint
}

export function createSyncRuntime(): RuntimeModule {
  const pressed = new Set<string>()
  const handledFeedbackKeys = new Set<string>()
  const pendingMoves: PendingMove[] = []

  let sendAccumulator = 0
  let requestSequence = 0
  let sessionCounter = 0
  let lastClientTsMs = 0
  let lastWallClockMs = 0
  let activeCorrection: ActiveCorrection | null = null
  let deferredServerCorrection: Vec3 | null = null
  let deferredCorrectionSeq = -1
  let lastAppliedFeedbackSeq = -1
  let stableAcceptedCount = 0
  let lastAcceptedSeqSeen = -1
  let lastAcceptedPos: Vec3 | null = null
  let queuedMovePosition: Vec3 | null = null
  let smoothedSpeedMps = 0
  let lastSampledPosition: Vec3 | null = null
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null
  let onKeyUp: ((event: KeyboardEvent) => void) | null = null
  let onWindowBlur: (() => void) | null = null

  const updateAcceptedStability = (sequence: number, serverPos: Vec3): void => {
    if (sequence <= lastAcceptedSeqSeen) {
      return
    }
    lastAcceptedSeqSeen = sequence

    if (!lastAcceptedPos) {
      lastAcceptedPos = serverPos
      stableAcceptedCount = 1
      return
    }

    const delta = Math.hypot(
      serverPos.x - lastAcceptedPos.x,
      serverPos.y - lastAcceptedPos.y,
      serverPos.z - lastAcceptedPos.z,
    )
    if (delta <= STABLE_ACCEPTED_POSITION_DELTA_METERS) {
      stableAcceptedCount += 1
    } else {
      stableAcceptedCount = 1
    }
    lastAcceptedPos = serverPos
  }

  const isStableAcceptedReady = (): boolean => {
    return stableAcceptedCount >= REQUIRED_STABLE_ACCEPTED_FEEDBACKS
  }

  return {
    name: 'SyncRuntime',
    start(ctx: RuntimeContext) {
      onKeyDown = (event) => {
        if (isTextInputFocused()) {
          return
        }
        if (isMovementKey(event.code)) {
          pressed.add(event.code)
        }
      }
      onKeyUp = (event) => {
        if (isMovementKey(event.code)) {
          pressed.delete(event.code)
        }
      }
      onWindowBlur = () => {
        pressed.clear()
      }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      window.addEventListener('blur', onWindowBlur)
      ctx.logger.info('sync runtime start')
    },
    tick(ctx: RuntimeContext, dtSeconds: number) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null
      const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Position)

      if (!connection || !connection.isActive || !localPlayer || !localIdentityHex) {
        activeCorrection = null
        deferredServerCorrection = null
        pendingMoves.length = 0
        return
      }

      const nowMs = Date.now()
      if (lastWallClockMs > 0 && nowMs < lastWallClockMs) {
        sessionCounter += 1
        requestSequence = 0
        ctx.logger.warn('clock regression detected, rolling movement request namespace', {
          previous: lastWallClockMs,
          now: nowMs,
          sessionCounter,
        })
      }
      lastWallClockMs = nowMs

      applyMovementInput(localPlayer, dtSeconds, pressed)
      if (pressed.size > 0) {
        // Do not fight local input with in-flight correction.
        activeCorrection = null
      }
      activeCorrection = applyActiveCorrection(localPlayer, nowMs, activeCorrection)
      smoothedSpeedMps = estimateSmoothedSpeed(localPlayer, dtSeconds, lastSampledPosition, smoothedSpeedMps)
      const sampled = localPlayer.get(Position)
      if (sampled) {
        lastSampledPosition = { x: sampled.x, y: sampled.y, z: sampled.z }
      }
      evictTimedOutPending(ctx, pendingMoves, nowMs)
      if (pressed.size === 0 && deferredServerCorrection && pendingMoves.length === 0) {
        if (isStableAcceptedReady()) {
          activeCorrection = reconcilePosition(localPlayer, deferredServerCorrection, true, nowMs, smoothedSpeedMps)
          deferredServerCorrection = null
          deferredCorrectionSeq = -1
          stableAcceptedCount = 0
        }
      }

      sendAccumulator += dtSeconds
      if (sendAccumulator >= SEND_INTERVAL_SECONDS) {
        sendAccumulator = 0
        const position = localPlayer.get(Position)
        const regionId = resolveLocalRegionId(connection, localIdentityHex)
        if (regionId !== null) {
          const source = queuedMovePosition ?? position
          if (source) {
            const clientTsMs = nextClientTimestamp(nowMs, () => lastClientTsMs, (value) => {
              lastClientTsMs = value
            })
            const requestId = buildMoveRequestId(localIdentityHex, sessionCounter, requestSequence, BOOT_NONCE)
            requestSequence += 1

            const payload = {
              requestId,
              regionId,
              clientTsMs,
              x: source.x,
              y: source.y,
              z: source.z,
            }

            const dispatched = dispatchMoveTo(connection, payload)
            if (dispatched) {
              pendingMoves.push({
                requestId,
                sentAtMs: nowMs,
              })
              if (pendingMoves.length > MAX_PENDING_MOVES) {
                pendingMoves.shift()
              }
              queuedMovePosition = null
            } else {
              ctx.logger.warn('move_to dispatch failed', { requestId })
            }
          }
        } else if (position && pressed.size > 0) {
          queuedMovePosition = { x: position.x, y: position.y, z: position.z }
        }
      }

      for (const feedback of connection.db.playerMovementFeedbackView.iter() as Iterable<PlayerMovementFeedbackRow>) {
        if (handledFeedbackKeys.has(feedback.requestKey)) {
          continue
        }
        if (identityHex(feedback.identity) !== localIdentityHex) {
          continue
        }

        handledFeedbackKeys.add(feedback.requestKey)
        trimHandledSet(handledFeedbackKeys)

        const serverPos = toServerPosition(feedback)
        const feedbackId = parseMoveRequestId(feedback.requestId)
        if (feedbackId && feedbackId.nonce !== BOOT_NONCE_STR) {
          continue
        }
        if (feedback.accepted && feedbackId && feedbackId.sequence <= lastAppliedFeedbackSeq) {
          continue
        }

        const droppedCount = acknowledgePendingMove(pendingMoves, feedback.requestId)
        if (droppedCount > 0) {
          ctx.logger.debug('movement request acknowledged', {
            requestId: feedback.requestId,
            droppedCount,
          })
        }

        // While newer predicted moves are still pending, this ack is stale for smoothing.
        if (feedback.accepted && pendingMoves.length > 0) {
          updateAcceptedStability(feedbackId?.sequence ?? -1, serverPos)
          continue
        }
        if (feedback.accepted && pressed.size > 0) {
          const requestSeq = feedbackId?.sequence ?? extractMoveSequence(feedback.requestId)
          updateAcceptedStability(requestSeq, serverPos)
          if (requestSeq >= deferredCorrectionSeq) {
            deferredServerCorrection = serverPos
            deferredCorrectionSeq = requestSeq
          }
          continue
        }
        if (feedback.accepted) {
          const requestSeq = feedbackId?.sequence ?? extractMoveSequence(feedback.requestId)
          updateAcceptedStability(requestSeq, serverPos)
          if (!isStableAcceptedReady()) {
            continue
          }
        }
        if (feedback.accepted && feedbackId) {
          lastAppliedFeedbackSeq = feedbackId.sequence
          stableAcceptedCount = 0
        }
        activeCorrection = reconcilePosition(localPlayer, serverPos, feedback.accepted, nowMs, smoothedSpeedMps)
      }
    },
    stop(ctx: RuntimeContext) {
      pressed.clear()
      handledFeedbackKeys.clear()
      pendingMoves.length = 0
      activeCorrection = null
      deferredServerCorrection = null
      deferredCorrectionSeq = -1
      lastAppliedFeedbackSeq = -1
      stableAcceptedCount = 0
      lastAcceptedSeqSeen = -1
      lastAcceptedPos = null
      queuedMovePosition = null
      smoothedSpeedMps = 0
      lastSampledPosition = null
      if (onKeyDown) {
        window.removeEventListener('keydown', onKeyDown)
        onKeyDown = null
      }
      if (onKeyUp) {
        window.removeEventListener('keyup', onKeyUp)
        onKeyUp = null
      }
      if (onWindowBlur) {
        window.removeEventListener('blur', onWindowBlur)
        onWindowBlur = null
      }
      ctx.logger.info('sync runtime stop')
    },
  }
}

function isMovementKey(code: string): boolean {
  return (
    code === 'KeyW' ||
    code === 'KeyA' ||
    code === 'KeyS' ||
    code === 'KeyD' ||
    code === 'ArrowUp' ||
    code === 'ArrowLeft' ||
    code === 'ArrowDown' ||
    code === 'ArrowRight'
  )
}

function isTextInputFocused(): boolean {
  const active = document.activeElement
  if (!active) {
    return false
  }
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    return true
  }
  return active instanceof HTMLElement && active.isContentEditable
}

function applyMovementInput(entity: Entity, dtSeconds: number, pressed: Set<string>): void {
  const current = entity.get(Position)
  if (!current) {
    return
  }

  const axisX =
    (pressed.has('KeyD') || pressed.has('ArrowRight') ? 1 : 0) -
    (pressed.has('KeyA') || pressed.has('ArrowLeft') ? 1 : 0)
  const axisZ =
    (pressed.has('KeyS') || pressed.has('ArrowDown') ? 1 : 0) -
    (pressed.has('KeyW') || pressed.has('ArrowUp') ? 1 : 0)
  if (axisX === 0 && axisZ === 0) {
    return
  }

  const len = Math.hypot(axisX, axisZ)
  if (len <= Number.EPSILON) {
    return
  }

  const scale = (MOVE_SPEED * dtSeconds) / len
  entity.set(Position, {
    x: current.x + axisX * scale,
    y: current.y,
    z: current.z + axisZ * scale,
  })
}


function applyActiveCorrection(entity: Entity, nowMs: number, correction: ActiveCorrection | null): ActiveCorrection | null {
  if (!correction) {
    return null
  }

  const current = entity.get(Position)
  if (!current) {
    return null
  }

  const elapsed = nowMs - correction.startedAtMs
  const t = Math.max(0, Math.min(1, elapsed / correction.durationMs))
  entity.set(Position, {
    x: correction.origin.x + (correction.target.x - correction.origin.x) * t,
    y: correction.origin.y + (correction.target.y - correction.origin.y) * t,
    z: correction.origin.z + (correction.target.z - correction.origin.z) * t,
  })

  if (t >= 1) {
    return null
  }
  return correction
}

function evictTimedOutPending(ctx: RuntimeContext, pendingMoves: PendingMove[], nowMs: number): void {
  while (pendingMoves.length > 0) {
    const head = pendingMoves[0]
    if (nowMs - head.sentAtMs <= PENDING_TIMEOUT_MS) {
      return
    }
    pendingMoves.shift()
    ctx.logger.warn('pending movement request expired', {
      requestId: head.requestId,
      ageMs: nowMs - head.sentAtMs,
    })
  }
}

function acknowledgePendingMove(pendingMoves: PendingMove[], requestId: string): number {
  const index = pendingMoves.findIndex((item) => item.requestId === requestId)
  if (index < 0) {
    return 0
  }
  const dropped = index + 1
  pendingMoves.splice(0, dropped)
  return dropped
}

function dispatchMoveTo(
  connection: DbConnection,
  payload: {
    requestId: string
    regionId: bigint
    clientTsMs: bigint
    x: number
    y: number
    z: number
  },
): boolean {
  const reducers = connection.reducers as unknown as {
    moveTo?: (args: {
      requestId: string
      regionId: bigint
      clientTsMs: bigint
      x: number
      y: number
      z: number
    }) => void
  }
  if (!reducers.moveTo) {
    return false
  }
  try {
    reducers.moveTo(payload)
    return true
  } catch {
    return false
  }
}

function resolveLocalRegionId(connection: DbConnection, localIdentityHex: string): bigint | null {
  for (const row of connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>) {
    if (identityHex(row.identity) === localIdentityHex) {
      return row.regionId
    }
  }
  return null
}

function nextClientTimestamp(
  wallClockMs: number,
  readLast: () => number,
  writeLast: (value: number) => void,
): bigint {
  const last = readLast()
  const next = wallClockMs <= last ? last + 1 : wallClockMs
  writeLast(next)
  return BigInt(next)
}

function reconcilePosition(
  entity: Entity,
  serverPos: Vec3,
  accepted: boolean,
  nowMs: number,
  speedMps: number,
): ActiveCorrection | null {
  const current = entity.get(Position)
  if (!current) {
    return null
  }

  if (!accepted) {
    entity.set(Position, {
      x: serverPos.x,
      y: serverPos.y,
      z: serverPos.z,
    })
    return null
  }

  const error = Math.hypot(serverPos.x - current.x, serverPos.y - current.y, serverPos.z - current.z)
  const speedFactor = speedAdaptFactor(speedMps)
  const adaptiveLerpThreshold = LERP_THRESHOLD_METERS * (1 + speedFactor * (SPEED_ADAPT_MAX_LERP_SCALE - 1))

  if (error <= adaptiveLerpThreshold) {
    return null
  }

  if (error >= SNAP_THRESHOLD_METERS) {
    if (!accepted) {
      entity.set(Position, {
        x: serverPos.x,
        y: serverPos.y,
        z: serverPos.z,
      })
      return null
    }
  }

  const normalized = (error - adaptiveLerpThreshold) / (SNAP_THRESHOLD_METERS - adaptiveLerpThreshold)
  const baseDurationMs = MIN_CORRECTION_MS + normalized * (MAX_CORRECTION_MS - MIN_CORRECTION_MS)
  const durationMs = Math.round(
    Math.min(MAX_ACCEPTED_CORRECTION_MS, baseDurationMs + speedFactor * SPEED_ADAPT_MAX_EXTRA_MS),
  )
  const target = clampCorrectionTarget(current, serverPos, MAX_ACCEPTED_CORRECTION_DISTANCE)
  return {
    origin: { x: current.x, y: current.y, z: current.z },
    target,
    startedAtMs: nowMs,
    durationMs,
  }
}

function trimHandledSet(keys: Set<string>): void {
  while (keys.size > MAX_FEEDBACK_KEYS) {
    const oldest = keys.values().next().value as string | undefined
    if (!oldest) {
      break
    }
    keys.delete(oldest)
  }
}

function toServerPosition(row: { serverX: number; serverY: number; serverZ: number }): Vec3 {
  return {
    x: Number.isFinite(row.serverX) ? row.serverX : 0,
    y: Number.isFinite(row.serverY) ? row.serverY : 0,
    z: Number.isFinite(row.serverZ) ? row.serverZ : 0,
  }
}

function identityHex(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return candidate.toHexString()
  }
  return String(value)
}

function estimateSmoothedSpeed(
  entity: Entity,
  dtSeconds: number,
  lastSampledPosition: Vec3 | null,
  currentSmoothedSpeed: number,
): number {
  const position = entity.get(Position)
  if (!position || !lastSampledPosition || dtSeconds <= Number.EPSILON) {
    return currentSmoothedSpeed
  }
  const delta = Math.hypot(
    position.x - lastSampledPosition.x,
    position.y - lastSampledPosition.y,
    position.z - lastSampledPosition.z,
  )
  const instantSpeed = delta / dtSeconds
  return currentSmoothedSpeed * (1 - SPEED_SMOOTHING) + instantSpeed * SPEED_SMOOTHING
}

function speedAdaptFactor(speedMps: number): number {
  if (speedMps <= SPEED_ADAPT_START_MPS) {
    return 0
  }
  if (speedMps >= SPEED_ADAPT_MAX_MPS) {
    return 1
  }
  return (speedMps - SPEED_ADAPT_START_MPS) / (SPEED_ADAPT_MAX_MPS - SPEED_ADAPT_START_MPS)
}

function clampCorrectionTarget(current: Vec3, desired: Vec3, maxDistance: number): Vec3 {
  const dx = desired.x - current.x
  const dy = desired.y - current.y
  const dz = desired.z - current.z
  const distance = Math.hypot(dx, dy, dz)
  if (distance <= maxDistance || distance <= Number.EPSILON) {
    return desired
  }
  const scale = maxDistance / distance
  return {
    x: current.x + dx * scale,
    y: current.y + dy * scale,
    z: current.z + dz * scale,
  }
}

function envNumber(name: string, fallback: number): number {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function envInt(name: string, fallback: number, min: number, max: number): number {
  const value = Math.round(envNumber(name, fallback))
  return Math.max(min, Math.min(max, value))
}

function buildMoveRequestId(identity: string, sessionCounter: number, sequence: number, bootNonce: number): string {
  const cleanIdentity = identity.replace(/^0x/, '')
  const sessionPart = sessionCounter.toString(36)
  const seqPart = sequence.toString(36)
  const noncePart = bootNonce.toString(36)
  const basePrefix = `mv:::${noncePart}:${sessionPart}:${seqPart}`
  const identityBudget = Math.max(8, REQUEST_ID_MAX_LENGTH - basePrefix.length)
  const identityPart = cleanIdentity.slice(-identityBudget)
  const requestId = `mv:${identityPart}:${noncePart}:${sessionPart}:${seqPart}`
  if (requestId.length <= REQUEST_ID_MAX_LENGTH) {
    return requestId
  }
  return requestId.slice(-REQUEST_ID_MAX_LENGTH)
}

function extractMoveSequence(requestId: string): number {
  const parsed = parseMoveRequestId(requestId)
  if (parsed) {
    return parsed.sequence
  }
  const tail = requestId.split(':').at(-1) ?? ''
  const value = Number.parseInt(tail, 36)
  return Number.isFinite(value) ? value : -1
}

function parseMoveRequestId(requestId: string): { nonce: string; sequence: number } | null {
  const parts = requestId.split(':')
  if (parts.length < 5 || parts[0] !== 'mv') {
    return null
  }
  const nonce = parts[2] ?? ''
  const tail = parts[parts.length - 1] ?? ''
  const sequence = Number.parseInt(tail, 36)
  if (!Number.isFinite(sequence)) {
    return null
  }
  return { nonce, sequence }
}
