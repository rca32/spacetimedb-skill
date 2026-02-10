import { Entity } from 'koota'
import { DbConnection } from '../module_bindings'
import { IsLocalPlayer, Position } from '../core/traits'
import { RuntimeContext, RuntimeModule } from './types'

const MOVE_SPEED = 5.5
const SEND_INTERVAL_SECONDS = 0.1
const MAX_FEEDBACK_KEYS = 256

type Vec3 = {
  x: number
  y: number
  z: number
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
  let sendAccumulator = 0
  let requestSequence = 0
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null
  let onKeyUp: ((event: KeyboardEvent) => void) | null = null

  return {
    name: 'SyncRuntime',
    start(ctx: RuntimeContext) {
      onKeyDown = (event) => {
        if (event.repeat) {
          return
        }
        if (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') {
          pressed.add(event.code)
        }
      }
      onKeyUp = (event) => {
        if (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') {
          pressed.delete(event.code)
        }
      }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      ctx.logger.info('sync runtime start')
    },
    tick(ctx: RuntimeContext, dtSeconds: number) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null
      const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Position)

      if (!connection || !connection.isActive || !localPlayer || !localIdentityHex) {
        return
      }

      applyMovementInput(localPlayer, dtSeconds, pressed)
      sendAccumulator += dtSeconds

      if (sendAccumulator >= SEND_INTERVAL_SECONDS) {
        sendAccumulator = 0
        const regionId = resolveLocalRegionId(connection, localIdentityHex)
        const position = localPlayer.get(Position)
        if (position) {
          const requestId = `mv-${Date.now()}-${requestSequence}`
          requestSequence += 1
          dispatchMoveTo(connection, {
            requestId,
            regionId,
            clientTsMs: BigInt(Date.now()),
            x: position.x,
            y: position.y,
            z: position.z,
          })
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
        reconcilePosition(localPlayer, serverPos, feedback.accepted)
      }
    },
    stop(ctx: RuntimeContext) {
      pressed.clear()
      handledFeedbackKeys.clear()
      if (onKeyDown) {
        window.removeEventListener('keydown', onKeyDown)
        onKeyDown = null
      }
      if (onKeyUp) {
        window.removeEventListener('keyup', onKeyUp)
        onKeyUp = null
      }
      ctx.logger.info('sync runtime stop')
    },
  }
}

function applyMovementInput(entity: Entity, dtSeconds: number, pressed: Set<string>): void {
  const position = entity.get(Position)
  if (!position) {
    return
  }

  const axisX = (pressed.has('KeyD') ? 1 : 0) - (pressed.has('KeyA') ? 1 : 0)
  const axisZ = (pressed.has('KeyS') ? 1 : 0) - (pressed.has('KeyW') ? 1 : 0)
  if (axisX === 0 && axisZ === 0) {
    return
  }

  const len = Math.hypot(axisX, axisZ)
  if (len <= Number.EPSILON) {
    return
  }

  const scale = (MOVE_SPEED * dtSeconds) / len
  position.x += axisX * scale
  position.z += axisZ * scale
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
): void {
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
  reducers.moveTo?.(payload)
}

function resolveLocalRegionId(connection: DbConnection, localIdentityHex: string): bigint {
  for (const row of connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>) {
    if (identityHex(row.identity) === localIdentityHex) {
      return row.regionId
    }
  }
  return 1n
}

function reconcilePosition(entity: Entity, serverPos: Vec3, accepted: boolean): void {
  const position = entity.get(Position)
  if (!position) {
    return
  }

  if (!accepted) {
    position.x = serverPos.x
    position.y = serverPos.y
    position.z = serverPos.z
    return
  }

  const blend = 0.35
  position.x += (serverPos.x - position.x) * blend
  position.y += (serverPos.y - position.y) * blend
  position.z += (serverPos.z - position.z) * blend
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
