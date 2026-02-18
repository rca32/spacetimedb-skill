import { Entity } from 'koota'
import type { Logger } from '../infra/logging'
import { DbConnection } from '../module_bindings'
import { Position, Rotation } from '../core/traits'

interface Vec3 {
  x: number
  y: number
  z: number
}

interface InputCommand {
  seq: number
  requestId: string
  sentAtMs: number
  regionId: bigint
  clientTsMs: bigint
  dtSeconds: number
  delta: Vec3
}

interface PredictedState {
  seq: number
  position: Vec3
  sampledAtMs: number
}

interface ParsedFeedback {
  seq: number
  requestKey: string
  requestId: string
  accepted: boolean
  serverPos: Vec3
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
  dimensionId: number
}

interface SyncTickInput {
  connection: DbConnection | null
  identityHex: string | null
  localPlayer: Entity | null
  dtSeconds: number
}

type BodyCouplingMode = 'coupled' | 'coupled_when_moving' | 'decoupled'

interface SyncOptions {
  moveSpeed: number
  mouseTurnSensitivityRad: number
  mousePitchSensitivityRad: number
  viewPitchMinRad: number
  viewPitchMaxRad: number
  viewPitchDefaultRad: number
  bodyCouplingMode: BodyCouplingMode
  bodyTurnSpeedRadPerSec: number
  turnSlowdownStartRad: number
  turnStopRad: number
  sendIntervalSeconds: number
  pendingTimeoutMs: number
  historyCapacity: number
  maxFeedbackKeys: number
  lerpThresholdMeters: number
  snapThresholdMeters: number
  maxAcceptedCorrectionDistance: number
  speedSmoothing: number
  speedAdaptStartMps: number
  speedAdaptMaxMps: number
  speedAdaptMaxLerpScale: number
  stableRequiredFeedbacks: number
  stablePositionDeltaMeters: number
  requestIdMaxLength: number
  pendingWarnMinIntervalMs: number
}

export interface SyncDiagnosticsSnapshot {
  nextSeq: number
  lastAckSeq: number
  pendingCount: number
  predictedCount: number
  sentTotal: number
  ackTotal: number
  acceptedTotal: number
  rejectedTotal: number
  timeoutExpiredTotal: number
  skippedIdentity: number
  skippedSession: number
  skippedDuplicateOrOld: number
  skippedStabilityCorrection: number
}

export class SeqRingBuffer<T extends { seq: number }> {
  private items: T[] = []

  constructor(private readonly capacity: number) {}

  clear(): void {
    this.items = []
  }

  size(): number {
    return this.items.length
  }

  oldest(): T | undefined {
    return this.items[0]
  }

  push(item: T): void {
    const existingIndex = this.items.findIndex((it) => it.seq === item.seq)
    if (existingIndex >= 0) {
      this.items[existingIndex] = item
      return
    }

    const last = this.items[this.items.length - 1]
    if (!last || item.seq > last.seq) {
      this.items.push(item)
    } else {
      const insertAt = this.items.findIndex((it) => it.seq > item.seq)
      if (insertAt < 0) {
        this.items.push(item)
      } else {
        this.items.splice(insertAt, 0, item)
      }
    }

    while (this.items.length > this.capacity) {
      this.items.shift()
    }
  }

  get(seq: number): T | undefined {
    return this.items.find((it) => it.seq === seq)
  }

  remove(seq: number): boolean {
    const index = this.items.findIndex((it) => it.seq === seq)
    if (index < 0) {
      return false
    }
    this.items.splice(index, 1)
    return true
  }

  removeUpTo(seq: number): void {
    while (this.items.length > 0 && this.items[0].seq <= seq) {
      this.items.shift()
    }
  }

  valuesAfter(seq: number): T[] {
    return this.items.filter((it) => it.seq > seq)
  }
}

export class SyncEngine {
  private readonly options: SyncOptions
  private readonly inputBuffer: SeqRingBuffer<InputCommand>
  private readonly predictedBuffer: SeqRingBuffer<PredictedState>

  private readonly pressed = new Set<string>()
  private readonly handledFeedbackKeys = new Set<string>()

  private sendAccumulator = 0
  private commandWindowDt = 0
  private commandWindowDelta: Vec3 = { x: 0, y: 0, z: 0 }

  private nextSeq = 0
  private lastAckSeq = -1
  private sessionCounter = 0
  private lastWallClockMs = 0
  private lastClientTsMs = 0

  private stableAcceptedCount = 0
  private lastStableAcceptedSeq = -1
  private lastStableAcceptedPos: Vec3 | null = null

  private smoothedSpeedMps = 0
  private lastSampledPosition: Vec3 | null = null

  private timeoutWarnedUntilSeq = -1
  private lastPendingWarnLogAtMs = 0
  private pendingWarnSuppressedCount = 0
  private wasActive = false

  private sentTotal = 0
  private ackTotal = 0
  private acceptedTotal = 0
  private rejectedTotal = 0
  private timeoutExpiredTotal = 0
  private skippedIdentity = 0
  private skippedSession = 0
  private skippedDuplicateOrOld = 0
  private skippedStabilityCorrection = 0

  private readonly bootNonce = Math.floor(Math.random() * 0xffff_ffff)
  private readonly bootNonceStr = this.bootNonce.toString(36)
  private viewYaw = 0
  private viewPitch = 0
  private bodyYaw = 0
  private bodyYawInitialized = false
  private aimModeActive = false

  constructor(private readonly logger: Logger) {
    this.options = loadSyncOptions()
    this.viewPitch = this.options.viewPitchDefaultRad
    this.inputBuffer = new SeqRingBuffer<InputCommand>(this.options.historyCapacity)
    this.predictedBuffer = new SeqRingBuffer<PredictedState>(this.options.historyCapacity)
  }

  handleKeyDown(code: string): void {
    if (isTextInputFocused()) {
      return
    }
    if (isMovementCode(code)) {
      this.pressed.add(code)
    }
  }

  handleKeyUp(code: string): void {
    if (isMovementCode(code)) {
      this.pressed.delete(code)
    }
  }

  handleWindowBlur(): void {
    this.pressed.clear()
    this.aimModeActive = false
  }

  handleMouseMove(deltaX: number, deltaY = 0): void {
    if (Number.isFinite(deltaX) && Math.abs(deltaX) > Number.EPSILON) {
      this.viewYaw = normalizeAngle(this.viewYaw - deltaX * this.options.mouseTurnSensitivityRad)
    }
    if (Number.isFinite(deltaY) && Math.abs(deltaY) > Number.EPSILON) {
      this.viewPitch = clampNumber(
        this.viewPitch - deltaY * this.options.mousePitchSensitivityRad,
        this.options.viewPitchMinRad,
        this.options.viewPitchMaxRad,
      )
    }
  }

  getViewYaw(): number {
    return this.viewYaw
  }

  getViewPitch(): number {
    return this.viewPitch
  }

  setAimModeActive(active: boolean): void {
    this.aimModeActive = active
  }

  isAimModeActive(): boolean {
    return this.aimModeActive
  }

  resetAll(): void {
    this.pressed.clear()
    this.resetNetworkState()
  }

  debugState(): {
    nextSeq: number
    lastAckSeq: number
    pendingCount: number
    predictedCount: number
  } {
    return {
      nextSeq: this.nextSeq,
      lastAckSeq: this.lastAckSeq,
      pendingCount: this.inputBuffer.size(),
      predictedCount: this.predictedBuffer.size(),
    }
  }

  getDiagnostics(): SyncDiagnosticsSnapshot {
    return {
      nextSeq: this.nextSeq,
      lastAckSeq: this.lastAckSeq,
      pendingCount: this.inputBuffer.size(),
      predictedCount: this.predictedBuffer.size(),
      sentTotal: this.sentTotal,
      ackTotal: this.ackTotal,
      acceptedTotal: this.acceptedTotal,
      rejectedTotal: this.rejectedTotal,
      timeoutExpiredTotal: this.timeoutExpiredTotal,
      skippedIdentity: this.skippedIdentity,
      skippedSession: this.skippedSession,
      skippedDuplicateOrOld: this.skippedDuplicateOrOld,
      skippedStabilityCorrection: this.skippedStabilityCorrection,
    }
  }

  tick(input: SyncTickInput): void {
    if (!input.connection || !input.connection.isActive || !input.identityHex || !input.localPlayer) {
      if (this.wasActive) {
        this.resetNetworkState()
      }
      this.wasActive = false
      return
    }
    this.wasActive = true

    const nowMs = Date.now()
    this.handleClockRegression(nowMs)

    const before = readPosition(input.localPlayer)
    if (!before) {
      return
    }

    this.applyLocalPrediction(input.localPlayer, input.dtSeconds)
    const afterPrediction = readPosition(input.localPlayer)
    if (!afterPrediction) {
      return
    }

    const frameDelta = subVec3(afterPrediction, before)
    this.commandWindowDelta = addVec3(this.commandWindowDelta, frameDelta)
    this.commandWindowDt += input.dtSeconds

    this.smoothedSpeedMps = smoothSpeed(frameDelta, input.dtSeconds, this.smoothedSpeedMps, this.options.speedSmoothing)
    this.lastSampledPosition = afterPrediction

    this.sendAccumulator += input.dtSeconds
    if (this.sendAccumulator >= this.options.sendIntervalSeconds) {
      this.sendAccumulator -= this.options.sendIntervalSeconds
      this.flushMoveCommand(input.connection, input.identityHex, input.localPlayer, nowMs)
    }

    this.processFeedbackRows(input.connection, input.identityHex, input.localPlayer)
    this.pruneTimedOutPending(nowMs)
  }

  private applyLocalPrediction(localPlayer: Entity, dtSeconds: number): void {
    const current = readPosition(localPlayer)
    if (!current) {
      return
    }

    const axis = movementAxis(this.pressed)
    const hasMovementInput = axis.x !== 0 || axis.z !== 0
    const couplingMode = this.resolveBodyCouplingMode()

    if (!this.bodyYawInitialized) {
      const existingYaw = readYawRotation(localPlayer)
      this.bodyYaw = normalizeAngle(existingYaw ?? this.viewYaw)
      this.bodyYawInitialized = true
    }

    if (shouldRotateBodyForMode(couplingMode, hasMovementInput)) {
      this.stepBodyYaw(dtSeconds)
    }
    writeYawRotation(localPlayer, this.bodyYaw)

    if (!hasMovementInput) {
      return
    }

    const yawError = yawErrorForMovementScale(couplingMode, this.viewYaw, this.bodyYaw)
    const moveSpeedScale = moveSpeedScaleFromYawError(yawError, this.options)
    if (moveSpeedScale <= Number.EPSILON) {
      return
    }

    const movementYaw = movementYawForMode(couplingMode, this.viewYaw, this.bodyYaw)
    const worldAxis = rotateMovementAxis(axis, movementYaw)

    const len = Math.hypot(worldAxis.x, worldAxis.z)
    if (len <= Number.EPSILON) {
      return
    }

    const scale = (this.options.moveSpeed * moveSpeedScale * dtSeconds) / len
    writePosition(localPlayer, {
      x: current.x + worldAxis.x * scale,
      y: current.y,
      z: current.z + worldAxis.z * scale,
    })
  }

  private stepBodyYaw(dtSeconds: number): void {
    if (dtSeconds <= Number.EPSILON) {
      return
    }

    const maxStep = this.options.bodyTurnSpeedRadPerSec * dtSeconds
    if (!Number.isFinite(maxStep) || maxStep <= Number.EPSILON) {
      return
    }

    const delta = normalizeAngle(this.viewYaw - this.bodyYaw)
    const step = Math.max(-maxStep, Math.min(maxStep, delta))
    this.bodyYaw = normalizeAngle(this.bodyYaw + step)
  }

  private resolveBodyCouplingMode(): BodyCouplingMode {
    if (this.aimModeActive) {
      return 'coupled'
    }
    return this.options.bodyCouplingMode
  }

  private flushMoveCommand(
    connection: DbConnection,
    identityHex: string,
    localPlayer: Entity,
    nowMs: number,
  ): void {
    const moved = magnitudeVec3(this.commandWindowDelta) > 0.0001
    if (!moved || this.commandWindowDt <= Number.EPSILON) {
      this.commandWindowDt = 0
      this.commandWindowDelta = { x: 0, y: 0, z: 0 }
      return
    }

    const regionId = resolveLocalRegionId(connection, identityHex)
    if (regionId === null) {
      return
    }

    const current = readPosition(localPlayer)
    if (!current) {
      return
    }

    const clientTsMs = this.nextClientTimestamp(nowMs)
    const seq = this.nextSeq
    const requestId = this.buildRequestId(identityHex, seq)

    const payload = {
      requestId,
      regionId,
      clientTsMs,
      x: current.x,
      y: current.y,
      z: current.z,
    }

    if (!dispatchMoveTo(connection, payload)) {
      this.logger.warn('move_to dispatch failed', { requestId })
      return
    }

    this.nextSeq += 1
    this.sentTotal += 1

    this.inputBuffer.push({
      seq,
      requestId,
      sentAtMs: nowMs,
      regionId,
      clientTsMs,
      dtSeconds: this.commandWindowDt,
      delta: this.commandWindowDelta,
    })

    this.predictedBuffer.push({
      seq,
      position: current,
      sampledAtMs: nowMs,
    })

    this.commandWindowDt = 0
    this.commandWindowDelta = { x: 0, y: 0, z: 0 }
  }

  private processFeedbackRows(connection: DbConnection, identityHex: string, localPlayer: Entity): void {
    const incoming: ParsedFeedback[] = []

    const normalizedIdentityHex = normalizeIdentityHex(identityHex)
    const currentSession = this.sessionCounter

    for (const row of connection.db.playerMovementFeedbackView.iter() as Iterable<PlayerMovementFeedbackRow>) {
      if (this.handledFeedbackKeys.has(row.requestKey)) {
        continue
      }
      this.handledFeedbackKeys.add(row.requestKey)
      trimHandledSet(this.handledFeedbackKeys, this.options.maxFeedbackKeys)

      if (normalizeIdentityHex(identityHexOf(row.identity)) !== normalizedIdentityHex) {
        this.skippedIdentity += 1
        continue
      }

      const parsed = parseMoveRequestId(row.requestId)
      if (!parsed || parsed.nonce !== this.bootNonceStr || parsed.session !== currentSession) {
        this.skippedSession += 1
        continue
      }

      if (parsed.sequence <= this.lastAckSeq) {
        this.skippedDuplicateOrOld += 1
        continue
      }

      incoming.push({
        seq: parsed.sequence,
        requestKey: row.requestKey,
        requestId: row.requestId,
        accepted: row.accepted,
        serverPos: toServerPosition(row),
      })
    }

    incoming.sort((left, right) => left.seq - right.seq)

    for (const feedback of incoming) {
      if (feedback.seq <= this.lastAckSeq) {
        continue
      }

      const acceptedStable = feedback.accepted ? this.observeAcceptedStability(feedback.seq, feedback.serverPos) : true

      const predicted = this.predictedBuffer.get(feedback.seq)
      const reference = predicted?.position ?? readPosition(localPlayer)
      if (!reference) {
        continue
      }

      const speedFactor = speedAdaptFactor(this.smoothedSpeedMps, this.options)
      const adaptiveThreshold = this.options.lerpThresholdMeters * (1 + speedFactor * (this.options.speedAdaptMaxLerpScale - 1))
      const errorMeters = distanceVec3(reference, feedback.serverPos)

      this.lastAckSeq = feedback.seq
      this.ackTotal += 1
      if (feedback.accepted) {
        this.acceptedTotal += 1
      } else {
        this.rejectedTotal += 1
      }
      this.inputBuffer.removeUpTo(feedback.seq)
      this.predictedBuffer.removeUpTo(feedback.seq)

      // Always ack accepted feedback first; stability gate only controls correction application.
      if (feedback.accepted && (!acceptedStable || errorMeters <= adaptiveThreshold)) {
        if (!acceptedStable) {
          this.skippedStabilityCorrection += 1
        }
        continue
      }

      this.rollbackReplay(localPlayer, feedback.seq, feedback.serverPos, feedback.accepted)
    }
  }

  private rollbackReplay(localPlayer: Entity, ackSeq: number, serverPos: Vec3, accepted: boolean): void {
    let replayPos = { ...serverPos }
    const remaining = this.inputBuffer.valuesAfter(ackSeq)

    for (const command of remaining) {
      replayPos = addVec3(replayPos, command.delta)
      this.predictedBuffer.push({
        seq: command.seq,
        position: replayPos,
        sampledAtMs: command.sentAtMs,
      })
    }

    const current = readPosition(localPlayer)
    if (!current) {
      return
    }

    if (!accepted) {
      writePosition(localPlayer, replayPos)
      return
    }

    const clampedTarget = clampCorrectionTarget(current, replayPos, this.options.maxAcceptedCorrectionDistance)
    writePosition(localPlayer, clampedTarget)
  }

  private pruneTimedOutPending(nowMs: number): void {
    let oldest = this.inputBuffer.oldest()
    while (oldest && nowMs - oldest.sentAtMs > this.options.pendingTimeoutMs) {
      if (oldest.seq > this.timeoutWarnedUntilSeq) {
        this.pendingWarnSuppressedCount += 1
        const shouldLog = nowMs - this.lastPendingWarnLogAtMs >= this.options.pendingWarnMinIntervalMs
        if (shouldLog) {
          this.logger.warn('pending movement request expired', {
            requestId: oldest.requestId,
            ageMs: nowMs - oldest.sentAtMs,
            expiredSinceLastLog: this.pendingWarnSuppressedCount,
          })
          this.pendingWarnSuppressedCount = 0
          this.lastPendingWarnLogAtMs = nowMs
        }
        this.timeoutWarnedUntilSeq = oldest.seq
      }

      this.timeoutExpiredTotal += 1
      this.inputBuffer.remove(oldest.seq)
      this.predictedBuffer.remove(oldest.seq)
      oldest = this.inputBuffer.oldest()
    }
  }

  private observeAcceptedStability(sequence: number, serverPos: Vec3): boolean {
    if (sequence <= this.lastStableAcceptedSeq) {
      return false
    }

    this.lastStableAcceptedSeq = sequence

    if (!this.lastStableAcceptedPos) {
      this.lastStableAcceptedPos = serverPos
      this.stableAcceptedCount = 1
      return this.stableAcceptedCount >= this.options.stableRequiredFeedbacks
    }

    const delta = distanceVec3(this.lastStableAcceptedPos, serverPos)
    if (delta <= this.options.stablePositionDeltaMeters) {
      this.stableAcceptedCount += 1
    } else {
      this.stableAcceptedCount = 1
    }

    this.lastStableAcceptedPos = serverPos
    return this.stableAcceptedCount >= this.options.stableRequiredFeedbacks
  }

  private handleClockRegression(nowMs: number): void {
    if (this.lastWallClockMs > 0 && nowMs < this.lastWallClockMs) {
      this.sessionCounter += 1
      this.nextSeq = 0
      this.logger.warn('clock regression detected, rolling movement request namespace', {
        previous: this.lastWallClockMs,
        now: nowMs,
        sessionCounter: this.sessionCounter,
      })
    }
    this.lastWallClockMs = nowMs
  }

  private nextClientTimestamp(nowMs: number): bigint {
    const next = nowMs <= this.lastClientTsMs ? this.lastClientTsMs + 1 : nowMs
    this.lastClientTsMs = next
    return BigInt(next)
  }

  private buildRequestId(identityHex: string, sequence: number): string {
    const cleanIdentity = normalizeIdentityHex(identityHex)
    const sessionPart = this.sessionCounter.toString(36)
    const seqPart = sequence.toString(36)
    const identityPart = cleanIdentity.slice(-8)
    const compact = `mv:${this.bootNonceStr}:${sessionPart}:${seqPart}`
    const withIdentity = `mv:${identityPart}:${this.bootNonceStr}:${sessionPart}:${seqPart}`

    const hardMax = Math.min(64, this.options.requestIdMaxLength)
    if (compact.length <= hardMax) {
      return compact
    }
    if (withIdentity.length <= hardMax) {
      return withIdentity
    }
    return compact.slice(-hardMax)
  }

  private resetNetworkState(): void {
    this.sendAccumulator = 0
    this.commandWindowDt = 0
    this.commandWindowDelta = { x: 0, y: 0, z: 0 }

    this.inputBuffer.clear()
    this.predictedBuffer.clear()

    this.handledFeedbackKeys.clear()
    this.lastAckSeq = -1
    this.stableAcceptedCount = 0
    this.lastStableAcceptedSeq = -1
    this.lastStableAcceptedPos = null

    this.smoothedSpeedMps = 0
    this.lastSampledPosition = null
    this.timeoutWarnedUntilSeq = -1
    this.lastPendingWarnLogAtMs = 0
    this.pendingWarnSuppressedCount = 0
    this.sessionCounter += 1
    this.nextSeq = 0
    this.viewYaw = 0
    this.viewPitch = this.options.viewPitchDefaultRad
    this.bodyYaw = 0
    this.bodyYawInitialized = false
    this.aimModeActive = false
  }
}

function loadSyncOptions(): SyncOptions {
  const viewPitchMinRad = (envNumber('VITE_SYNC_VIEW_PITCH_MIN_DEG', -35) * Math.PI) / 180
  const rawViewPitchMaxRad = (envNumber('VITE_SYNC_VIEW_PITCH_MAX_DEG', 65) * Math.PI) / 180
  const viewPitchMaxRad = Math.max(viewPitchMinRad + 0.01, rawViewPitchMaxRad)
  const viewPitchDefaultRad = clampNumber(
    (envNumber('VITE_SYNC_VIEW_PITCH_DEFAULT_DEG', -18) * Math.PI) / 180,
    viewPitchMinRad,
    viewPitchMaxRad,
  )
  const turnSlowdownStartRad = (envNumber('VITE_SYNC_TURN_SLOWDOWN_START_DEG', 15) * Math.PI) / 180
  const rawTurnStopRad = (envNumber('VITE_SYNC_TURN_STOP_DEG', 55) * Math.PI) / 180
  const turnStopRad = Math.max(turnSlowdownStartRad + 0.01, rawTurnStopRad)

  return {
    moveSpeed: envNumber('VITE_SYNC_MOVE_SPEED', 5.5),
    mouseTurnSensitivityRad: (envNumber('VITE_SYNC_MOUSE_TURN_SENS_DEG', 0.12) * Math.PI) / 180,
    mousePitchSensitivityRad: (envNumber('VITE_SYNC_MOUSE_PITCH_SENS_DEG', 0.1) * Math.PI) / 180,
    viewPitchMinRad,
    viewPitchMaxRad,
    viewPitchDefaultRad,
    bodyCouplingMode: parseBodyCouplingMode(import.meta.env.VITE_SYNC_BODY_COUPLING_MODE),
    bodyTurnSpeedRadPerSec: (envNumber('VITE_SYNC_BODY_TURN_SPEED_DEG', 210) * Math.PI) / 180,
    turnSlowdownStartRad,
    turnStopRad,
    sendIntervalSeconds: envNumber('VITE_SYNC_SEND_INTERVAL_SECONDS', 0.08),
    pendingTimeoutMs: envNumber('VITE_SYNC_PENDING_TIMEOUT_MS', 4_000),
    historyCapacity: envInt('VITE_SYNC_HISTORY_CAPACITY', 512, 64, 4096),
    maxFeedbackKeys: envInt('VITE_SYNC_MAX_FEEDBACK_KEYS', 4096, 128, 32768),
    lerpThresholdMeters: envNumber('VITE_SYNC_LERP_THRESHOLD_METERS', 0.3),
    snapThresholdMeters: envNumber('VITE_SYNC_SNAP_THRESHOLD_METERS', 2.5),
    maxAcceptedCorrectionDistance: envNumber('VITE_SYNC_MAX_ACCEPTED_CORRECTION_DISTANCE', 1.2),
    speedSmoothing: envNumber('VITE_SYNC_SPEED_SMOOTHING', 0.25),
    speedAdaptStartMps: envNumber('VITE_SYNC_SPEED_ADAPT_START_MPS', 2.5),
    speedAdaptMaxMps: envNumber('VITE_SYNC_SPEED_ADAPT_MAX_MPS', 7.5),
    speedAdaptMaxLerpScale: envNumber('VITE_SYNC_SPEED_ADAPT_MAX_LERP_SCALE', 1.5),
    stableRequiredFeedbacks: envInt('VITE_SYNC_STABLE_REQUIRED_FEEDBACKS', 3, 1, 8),
    stablePositionDeltaMeters: envNumber('VITE_SYNC_STABLE_POSITION_DELTA_METERS', 0.35),
    requestIdMaxLength: envInt('VITE_SYNC_REQUEST_ID_MAX_LENGTH', 64, 32, 128),
    pendingWarnMinIntervalMs: envNumber('VITE_SYNC_PENDING_WARN_MIN_INTERVAL_MS', 1_500),
  }
}

function readPosition(entity: Entity): Vec3 | null {
  const pos = entity.get(Position)
  if (!pos) {
    return null
  }
  return { x: pos.x, y: pos.y, z: pos.z }
}

function readYawRotation(entity: Entity): number | null {
  const rot = entity.get(Rotation)
  if (!rot) {
    return null
  }
  return normalizeAngle(Math.atan2(2 * rot.w * rot.y, 1 - 2 * rot.y * rot.y))
}

function writePosition(entity: Entity, position: Vec3): void {
  entity.set(Position, {
    x: position.x,
    y: position.y,
    z: position.z,
  })
}

function writeYawRotation(entity: Entity, yaw: number): void {
  const halfYaw = yaw * 0.5
  entity.set(Rotation, {
    x: 0,
    y: Math.sin(halfYaw),
    z: 0,
    w: Math.cos(halfYaw),
  })
}

function movementAxis(pressed: Set<string>): { x: number; z: number } {
  const x =
    (pressed.has('KeyD') || pressed.has('ArrowRight') ? 1 : 0) -
    (pressed.has('KeyA') || pressed.has('ArrowLeft') ? 1 : 0)
  const z =
    (pressed.has('KeyS') || pressed.has('ArrowDown') ? 1 : 0) -
    (pressed.has('KeyW') || pressed.has('ArrowUp') ? 1 : 0)
  return { x, z }
}

function rotateMovementAxis(axis: { x: number; z: number }, yaw: number): { x: number; z: number } {
  const sinYaw = Math.sin(yaw)
  const cosYaw = Math.cos(yaw)
  return {
    x: axis.x * cosYaw + axis.z * sinYaw,
    z: -axis.x * sinYaw + axis.z * cosYaw,
  }
}

function isMovementCode(code: string): boolean {
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
  if (typeof document === 'undefined') {
    return false
  }
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) {
    return false
  }

  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    if (active.disabled || active.readOnly) {
      return false
    }
    return isElementVisible(active)
  }

  if (!active.isContentEditable) {
    return false
  }

  return isElementVisible(active)
}

function isElementVisible(element: HTMLElement): boolean {
  if (element.getClientRects().length === 0) {
    return false
  }
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function resolveLocalRegionId(connection: DbConnection, localIdentityHex: string): bigint | null {
  const normalizedLocalIdentity = normalizeIdentityHex(localIdentityHex)
  for (const row of connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>) {
    if (normalizeIdentityHex(identityHexOf(row.identity)) === normalizedLocalIdentity) {
      return row.regionId
    }
  }
  return null
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

function parseMoveRequestId(requestId: string): { nonce: string; session: number; sequence: number } | null {
  const parts = requestId.split(':')
  if (parts.length < 3) {
    return null
  }
  const isCanonical = parts[0] === 'mv' && parts.length >= 5
  const nonceIndex = isCanonical ? 2 : Math.max(0, parts.length - 3)
  const nonce = parts[nonceIndex] ?? ''
  const sessionPart = parts[parts.length - 2] ?? ''
  const tail = parts[parts.length - 1] ?? ''
  const session = Number.parseInt(sessionPart, 36)
  const sequence = Number.parseInt(tail, 36)
  if (!Number.isFinite(session) || !Number.isFinite(sequence)) {
    return null
  }
  return { nonce, session, sequence }
}

function toServerPosition(row: { serverX: number; serverY: number; serverZ: number }): Vec3 {
  return {
    x: Number.isFinite(row.serverX) ? row.serverX : 0,
    y: Number.isFinite(row.serverY) ? row.serverY : 0,
    z: Number.isFinite(row.serverZ) ? row.serverZ : 0,
  }
}

function identityHexOf(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return candidate.toHexString()
  }
  return String(value)
}

function normalizeIdentityHex(value: string): string {
  return value.replace(/^0x/i, '').toLowerCase()
}

function trimHandledSet(keys: Set<string>, maxSize: number): void {
  while (keys.size > maxSize) {
    const oldest = keys.values().next().value as string | undefined
    if (!oldest) {
      break
    }
    keys.delete(oldest)
  }
}

function addVec3(left: Vec3, right: Vec3): Vec3 {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  }
}

function subVec3(left: Vec3, right: Vec3): Vec3 {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z,
  }
}

function magnitudeVec3(value: Vec3): number {
  return Math.hypot(value.x, value.y, value.z)
}

function distanceVec3(left: Vec3, right: Vec3): number {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z)
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

function smoothSpeed(delta: Vec3, dtSeconds: number, currentSmoothed: number, alpha: number): number {
  if (dtSeconds <= Number.EPSILON) {
    return currentSmoothed
  }
  const instant = magnitudeVec3(delta) / dtSeconds
  return currentSmoothed * (1 - alpha) + instant * alpha
}

function speedAdaptFactor(speedMps: number, options: SyncOptions): number {
  if (speedMps <= options.speedAdaptStartMps) {
    return 0
  }
  if (speedMps >= options.speedAdaptMaxMps) {
    return 1
  }
  return (speedMps - options.speedAdaptStartMps) / (options.speedAdaptMaxMps - options.speedAdaptStartMps)
}

function moveSpeedScaleFromYawError(yawErrorRad: number, options: SyncOptions): number {
  if (yawErrorRad <= options.turnSlowdownStartRad) {
    return 1
  }
  if (yawErrorRad >= options.turnStopRad) {
    return 0
  }

  const span = options.turnStopRad - options.turnSlowdownStartRad
  if (span <= Number.EPSILON) {
    return 0
  }
  const t = (yawErrorRad - options.turnSlowdownStartRad) / span
  return 1 - t
}

function parseBodyCouplingMode(raw: unknown): BodyCouplingMode {
  if (typeof raw !== 'string') {
    return 'coupled_when_moving'
  }
  const value = raw.trim().toLowerCase()
  if (value === 'coupled' || value === 'coupled_when_moving' || value === 'decoupled') {
    return value
  }
  if (value === 'coupled-when-moving' || value === 'coupledwhenmoving') {
    return 'coupled_when_moving'
  }
  return 'coupled_when_moving'
}

function shouldRotateBodyForMode(mode: BodyCouplingMode, hasMovementInput: boolean): boolean {
  if (mode === 'coupled') {
    return true
  }
  if (mode === 'coupled_when_moving') {
    return hasMovementInput
  }
  return false
}

function movementYawForMode(mode: BodyCouplingMode, viewYaw: number, bodyYaw: number): number {
  if (mode === 'decoupled') {
    return viewYaw
  }
  return bodyYaw
}

function yawErrorForMovementScale(mode: BodyCouplingMode, viewYaw: number, bodyYaw: number): number {
  if (mode === 'decoupled') {
    return 0
  }
  return Math.abs(normalizeAngle(viewYaw - bodyYaw))
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
  const rounded = Math.round(envNumber(name, fallback))
  return Math.max(min, Math.min(max, rounded))
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    return 0
  }
  const twoPi = Math.PI * 2
  let normalized = angle % twoPi
  if (normalized > Math.PI) {
    normalized -= twoPi
  } else if (normalized < -Math.PI) {
    normalized += twoPi
  }
  return normalized
}
