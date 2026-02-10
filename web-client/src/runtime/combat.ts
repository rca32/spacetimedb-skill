import { DbConnection } from '../module_bindings'
import { RuntimeContext, RuntimeModule } from './types'

const ATTACK_COOLDOWN_MS = 600
const MAX_TRACKED_KEYS = 256

type IdentityLike = unknown

type AttackScheduleStateRow = {
  requestKey: string
  attackerIdentity: IdentityLike
  targetIdentity: IdentityLike
  clientTsMs: bigint
  phase: number
}

type CombatStateRow = {
  identity: IdentityLike
  inCombat: boolean
  currentHp: number
}

type PlayerSessionViewRow = {
  identity: IdentityLike
  regionId: bigint
}

export function createCombatRuntime(): RuntimeModule {
  const pressed = new Set<string>()
  const scheduledSeen = new Set<string>()
  const impactedSeen = new Set<string>()
  let requestSequence = 0
  let lastAttackMs = 0
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null
  let onKeyUp: ((event: KeyboardEvent) => void) | null = null

  return {
    name: 'CombatRuntime',
    start(ctx: RuntimeContext) {
      onKeyDown = (event) => {
        if (event.repeat) {
          return
        }
        if (event.code === 'Space') {
          pressed.add('Space')
        }
      }
      onKeyUp = (event) => {
        if (event.code === 'Space') {
          pressed.delete('Space')
        }
      }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      ctx.logger.info('combat runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null
      if (!connection || !connection.isActive || !localIdentityHex) {
        return
      }

      const nowMs = Date.now()
      if (pressed.has('Space') && nowMs - lastAttackMs >= ATTACK_COOLDOWN_MS) {
        const targetIdentity = pickAttackTargetIdentity(connection, localIdentityHex)
        if (targetIdentity) {
          const requestId = `atk-${nowMs}-${requestSequence}`
          requestSequence += 1
          dispatchAttackStart(connection, {
            requestId,
            targetIdentity,
            clientTsMs: BigInt(nowMs),
          })
          lastAttackMs = nowMs
        }
      }

      for (const state of connection.db.attackScheduleState.iter() as Iterable<AttackScheduleStateRow>) {
        if (identityHex(state.attackerIdentity) !== localIdentityHex) {
          continue
        }
        if (!scheduledSeen.has(state.requestKey)) {
          dispatchAttackScheduled(connection, { requestKey: state.requestKey })
          scheduledSeen.add(state.requestKey)
          trimTrackedSet(scheduledSeen)
        }
        if (state.phase > 0 && !impactedSeen.has(state.requestKey)) {
          dispatchAttackImpact(connection, {
            requestKey: state.requestKey,
            clientTsMs: state.clientTsMs,
          })
          impactedSeen.add(state.requestKey)
          trimTrackedSet(impactedSeen)
        }
      }
    },
    stop(ctx: RuntimeContext) {
      pressed.clear()
      scheduledSeen.clear()
      impactedSeen.clear()
      if (onKeyDown) {
        window.removeEventListener('keydown', onKeyDown)
        onKeyDown = null
      }
      if (onKeyUp) {
        window.removeEventListener('keyup', onKeyUp)
        onKeyUp = null
      }
      ctx.logger.info('combat runtime stop')
    },
  }
}

function pickAttackTargetIdentity(connection: DbConnection, localIdentityHex: string): IdentityLike | null {
  const localRegionId = resolveLocalRegionId(connection, localIdentityHex)

  for (const row of connection.db.combatState.iter() as Iterable<CombatStateRow & { regionId?: bigint }>) {
    if (identityHex(row.identity) === localIdentityHex) {
      continue
    }
    if (localRegionId !== null && row.regionId !== undefined && row.regionId !== localRegionId) {
      continue
    }
    return row.identity
  }
  return null
}

function resolveLocalRegionId(connection: DbConnection, localIdentityHex: string): bigint | null {
  for (const row of connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>) {
    if (identityHex(row.identity) === localIdentityHex) {
      return row.regionId
    }
  }
  return null
}

function dispatchAttackStart(
  connection: DbConnection,
  payload: {
    requestId: string
    targetIdentity: IdentityLike
    clientTsMs: bigint
  },
): void {
  const reducers = connection.reducers as unknown as {
    attackStart?: (args: {
      requestId: string
      targetIdentity: IdentityLike
      clientTsMs: bigint
    }) => void
  }
  reducers.attackStart?.(payload)
}

function dispatchAttackScheduled(connection: DbConnection, payload: { requestKey: string }): void {
  const reducers = connection.reducers as unknown as {
    attackScheduled?: (args: { requestKey: string }) => void
  }
  reducers.attackScheduled?.(payload)
}

function dispatchAttackImpact(
  connection: DbConnection,
  payload: {
    requestKey: string
    clientTsMs: bigint
  },
): void {
  const reducers = connection.reducers as unknown as {
    attackImpact?: (args: { requestKey: string; clientTsMs: bigint }) => void
  }
  reducers.attackImpact?.(payload)
}

function trimTrackedSet(keys: Set<string>): void {
  while (keys.size > MAX_TRACKED_KEYS) {
    const oldest = keys.values().next().value as string | undefined
    if (!oldest) {
      break
    }
    keys.delete(oldest)
  }
}

function identityHex(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return candidate.toHexString()
  }
  return String(value)
}
