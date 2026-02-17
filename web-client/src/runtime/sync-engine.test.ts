import { describe, expect, it } from 'bun:test'
import type { Entity } from 'koota'
import type { Logger } from '../infra/logging'
import type { DbConnection } from '../module_bindings'
import { Position, Rotation } from '../core/traits'
import { SeqRingBuffer, SyncEngine } from './sync-engine'

type FeedbackRow = {
  requestKey: string
  identity: unknown
  requestId: string
  accepted: boolean
  reasonCode: string
  serverX: number
  serverY: number
  serverZ: number
}

function createLogger(): Logger {
  return {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }
}

function createMockEntity(initial: { x: number; y: number; z: number }): Entity & {
  read: () => { x: number; y: number; z: number }
  readRotation: () => { x: number; y: number; z: number; w: number }
} {
  let pos = { ...initial }
  let rot = { x: 0, y: 0, z: 0, w: 1 }
  const entity = {
    get: (trait: unknown) => {
      if (trait === Position) {
        return { ...pos }
      }
      if (trait === Rotation) {
        return { ...rot }
      }
      return undefined
    },
    set: (trait: unknown, next: { x: number; y: number; z: number; w?: number }) => {
      if (trait === Position) {
        pos = { x: next.x, y: next.y, z: next.z }
        return
      }
      if (trait === Rotation) {
        rot = {
          x: next.x,
          y: next.y,
          z: next.z,
          w: next.w ?? 1,
        }
      }
    },
    read: () => ({ ...pos }),
    readRotation: () => ({ ...rot }),
  }
  return entity as unknown as Entity & {
    read: () => { x: number; y: number; z: number }
    readRotation: () => { x: number; y: number; z: number; w: number }
  }
}

function createMockConnection(
  identityHex: string,
  feedbackRows: FeedbackRow[],
  sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }>,
): DbConnection {
  const identity = { toHexString: () => identityHex }

  return {
    isActive: true,
    db: {
      playerSessionView: {
        iter: () => [{ identity, regionId: 1n }][Symbol.iterator](),
      },
      playerMovementFeedbackView: {
        iter: () => feedbackRows[Symbol.iterator](),
      },
    },
    reducers: {
      moveTo: (payload: { requestId: string; x: number; y: number; z: number }) => {
        sentPayloads.push({
          requestId: payload.requestId,
          x: payload.x,
          y: payload.y,
          z: payload.z,
        })
      },
    },
  } as unknown as DbConnection
}

describe('SeqRingBuffer', () => {
  it('keeps seq ordering and trims capacity', () => {
    const buffer = new SeqRingBuffer<{ seq: number; value: string }>(3)

    buffer.push({ seq: 2, value: 'b' })
    buffer.push({ seq: 0, value: 'a' })
    buffer.push({ seq: 1, value: 'x' })
    buffer.push({ seq: 1, value: 'c' })
    buffer.push({ seq: 3, value: 'd' })

    expect(buffer.valuesAfter(-1).map((row) => row.seq)).toEqual([1, 2, 3])
    expect(buffer.get(1)?.value).toBe('c')

    buffer.removeUpTo(2)
    expect(buffer.valuesAfter(-1).map((row) => row.seq)).toEqual([3])
  })
})

describe('SyncEngine rollback/replay', () => {
  it('rolls back to authoritative point and replays later predicted input', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyD')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })

    expect(sentPayloads.length).toBe(2)
    expect(localPlayer.read().x).toBeGreaterThan(0.8)

    feedbackRows.push({
      requestKey: `k:${sentPayloads[0].requestId}`,
      identity: { toHexString: () => identityHex },
      requestId: sentPayloads[0].requestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: 0,
      serverY: 0,
      serverZ: 0,
    })

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })

    // After seq0 reject, engine should rollback to auth(0) and replay seq1 delta.
    expect(localPlayer.read().x).toBeGreaterThan(0.3)
    expect(localPlayer.read().x).toBeLessThan(0.6)
  })

  it('handles out-of-order feedback without regressing ack state', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyD')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })

    expect(sentPayloads.length).toBe(2)

    // Reverse arrival order: seq1 first, then seq0
    feedbackRows.push({
      requestKey: `k:${sentPayloads[1].requestId}`,
      identity: { toHexString: () => identityHex },
      requestId: sentPayloads[1].requestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: 1.2,
      serverY: 0,
      serverZ: 0,
    })
    feedbackRows.push({
      requestKey: `k:${sentPayloads[0].requestId}`,
      identity: { toHexString: () => identityHex },
      requestId: sentPayloads[0].requestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: 0.0,
      serverY: 0,
      serverZ: 0,
    })

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })

    const state = engine.debugState()
    expect(state.lastAckSeq).toBe(1)
    expect(state.pendingCount).toBe(0)

    // Old feedback replayed later should not regress state.
    feedbackRows.push({
      requestKey: `k2:${sentPayloads[0].requestId}`,
      identity: { toHexString: () => identityHex },
      requestId: sentPayloads[0].requestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: -9,
      serverY: 0,
      serverZ: 0,
    })
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })

    const next = engine.debugState()
    expect(next.lastAckSeq).toBe(1)
  })

  it('does not advance ack sequence when pending request times out', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    const originalNow = Date.now
    let now = 1_000
    Date.now = () => now
    try {
      engine.handleKeyDown('KeyD')
      engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
      expect(sentPayloads.length).toBe(1)

      now = 6_000
      engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })

      const state = engine.debugState()
      expect(state.pendingCount).toBe(0)
      expect(state.lastAckSeq).toBe(-1)
    } finally {
      Date.now = originalNow
    }
  })

  it('matches feedback identity even with 0x prefix and case differences', () => {
    const identityHex = '1519f841ce56c15006ae4e183366e7297a7ef5ed527cba7b5'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyD')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    expect(sentPayloads.length).toBe(1)

    feedbackRows.push({
      requestKey: `k:${sentPayloads[0].requestId}`,
      identity: { toHexString: () => `0x${identityHex.toUpperCase()}` },
      requestId: sentPayloads[0].requestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: 0,
      serverY: 0,
      serverZ: 0,
    })

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })
    const state = engine.debugState()
    expect(state.lastAckSeq).toBe(0)
  })

  it('advances ack for accepted feedback even when stability gate skips correction', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyD')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    expect(sentPayloads.length).toBe(1)

    feedbackRows.push({
      requestKey: `k:${sentPayloads[0].requestId}`,
      identity: { toHexString: () => identityHex },
      requestId: sentPayloads[0].requestId,
      accepted: true,
      reasonCode: 'ok',
      serverX: 10,
      serverY: 0,
      serverZ: 0,
    })

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })
    const state = engine.debugState()
    expect(state.lastAckSeq).toBe(0)
    expect(state.pendingCount).toBe(0)
  })

  it('builds movement request id within server 64-char limit', () => {
    const identityHex = '1519f841ce56c15006ae4e183366e7297a7ef5ed527cba7b5'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyD')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    expect(sentPayloads.length).toBe(1)
    expect(sentPayloads[0].requestId.length).toBeLessThanOrEqual(64)
  })

  it('applies mouse yaw to forward movement direction', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleMouseMove(300)
    const viewYaw = engine.getViewYaw()
    expect(Math.abs(viewYaw)).toBeGreaterThan(0.01)

    engine.handleKeyDown('KeyW')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })

    const rot = localPlayer.readRotation()
    const bodyYaw = Math.atan2(2 * rot.w * rot.y, 1 - 2 * rot.y * rot.y)
    expect(Math.abs(bodyYaw)).toBeGreaterThan(0.01)
    expect(Math.abs(bodyYaw)).toBeLessThan(Math.abs(viewYaw))

    const moved = localPlayer.read()
    const distance = Math.hypot(moved.x, moved.z)
    expect(distance).toBeGreaterThan(0.01)
    expect(Math.abs(moved.x / distance + Math.sin(bodyYaw))).toBeLessThan(0.01)
    expect(Math.abs(moved.z / distance + Math.cos(bodyYaw))).toBeLessThan(0.01)
  })

  it('maps mouse deltas to third-person look directions', () => {
    const engine = new SyncEngine(createLogger())
    const yawBefore = engine.getViewYaw()
    const pitchBefore = engine.getViewPitch()

    engine.handleMouseMove(120, -120)

    expect(engine.getViewYaw()).toBeLessThan(yawBefore)
    expect(engine.getViewPitch()).toBeGreaterThan(pitchBefore)
  })

  it('keeps body yaw fixed while idle in coupled-when-moving mode', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleMouseMove(450)
    const viewYaw = engine.getViewYaw()
    expect(Math.abs(viewYaw)).toBeGreaterThan(0.01)

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    const rot = localPlayer.readRotation()
    const bodyYaw = Math.atan2(2 * rot.w * rot.y, 1 - 2 * rot.y * rot.y)
    expect(Math.abs(bodyYaw)).toBeLessThan(1e-6)
  })

  it('clamps view pitch to configured min/max', () => {
    const engine = new SyncEngine(createLogger())
    const minPitch = (-35 * Math.PI) / 180
    const maxPitch = (65 * Math.PI) / 180

    engine.handleMouseMove(0, 1_000_000)
    expect(engine.getViewPitch()).toBeLessThanOrEqual(maxPitch)

    engine.handleMouseMove(0, -1_000_000)
    expect(engine.getViewPitch()).toBeGreaterThan(minPitch - 1e-6)
  })

  it('starts with a slight downward default pitch', () => {
    const engine = new SyncEngine(createLogger())
    expect(engine.getViewPitch()).toBeLessThan(0)
  })

  it('suppresses immediate movement when yaw turns sharply', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyW')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    const before = localPlayer.read()

    engine.handleMouseMove(2200)
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    const after = localPlayer.read()

    const frameDistance = Math.hypot(after.x - before.x, after.z - before.z)
    expect(frameDistance).toBeLessThan(0.01)
  })

  it('never moves opposite to camera forward while turning', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyW')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    engine.handleMouseMove(2200)

    for (let i = 0; i < 20; i += 1) {
      const before = localPlayer.read()
      engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
      const after = localPlayer.read()
      const dx = after.x - before.x
      const dz = after.z - before.z
      const distance = Math.hypot(dx, dz)
      if (distance <= 1e-6) {
        continue
      }

      const viewYaw = engine.getViewYaw()
      const forwardX = -Math.sin(viewYaw)
      const forwardZ = -Math.cos(viewYaw)
      const forwardDot = (dx * forwardX + dz * forwardZ) / distance
      expect(forwardDot).toBeGreaterThan(-1e-3)
    }
  })

  it('ignores stale feedback from previous session namespace', () => {
    const identityHex = 'local-identity'
    const feedbackRows: FeedbackRow[] = []
    const sentPayloads: Array<{ requestId: string; x: number; y: number; z: number }> = []
    const connection = createMockConnection(identityHex, feedbackRows, sentPayloads)
    const localPlayer = createMockEntity({ x: 0, y: 0, z: 0 })
    const engine = new SyncEngine(createLogger())

    engine.handleKeyDown('KeyD')
    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    const oldSessionRequestId = sentPayloads[0].requestId

    engine.tick({ connection: null, identityHex: null, localPlayer: null, dtSeconds: 0 })

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0.08 })
    const newSessionRequestId = sentPayloads[1].requestId

    feedbackRows.push({
      requestKey: `old:${oldSessionRequestId}`,
      identity: { toHexString: () => identityHex },
      requestId: oldSessionRequestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: -99,
      serverY: 0,
      serverZ: 0,
    })
    feedbackRows.push({
      requestKey: `new:${newSessionRequestId}`,
      identity: { toHexString: () => identityHex },
      requestId: newSessionRequestId,
      accepted: false,
      reasonCode: 'reject',
      serverX: 0,
      serverY: 0,
      serverZ: 0,
    })

    engine.tick({ connection, identityHex, localPlayer, dtSeconds: 0 })

    const state = engine.debugState()
    expect(state.lastAckSeq).toBe(0)
    expect(state.pendingCount).toBe(0)
  })
})
