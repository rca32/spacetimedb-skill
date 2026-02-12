import { IsLocalPlayer, Position } from '../core/traits'
import { RuntimeContext, RuntimeModule } from './types'
import { SyncEngine } from './sync-engine'

export function createSyncRuntime(): RuntimeModule {
  let engine: SyncEngine | null = null
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null
  let onKeyUp: ((event: KeyboardEvent) => void) | null = null
  let onWindowBlur: (() => void) | null = null

  return {
    name: 'SyncRuntime',
    start(ctx: RuntimeContext) {
      engine = new SyncEngine(ctx.logger)
      ctx.sync = {
        getDiagnostics: () =>
          engine?.getDiagnostics() ?? {
            nextSeq: 0,
            lastAckSeq: -1,
            pendingCount: 0,
            predictedCount: 0,
            sentTotal: 0,
            ackTotal: 0,
            acceptedTotal: 0,
            rejectedTotal: 0,
            timeoutExpiredTotal: 0,
            skippedIdentity: 0,
            skippedSession: 0,
            skippedDuplicateOrOld: 0,
            skippedStabilityCorrection: 0,
          },
      }

      onKeyDown = (event) => {
        engine?.handleKeyDown(event.code)
      }
      onKeyUp = (event) => {
        engine?.handleKeyUp(event.code)
      }
      onWindowBlur = () => {
        engine?.handleWindowBlur()
      }

      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      window.addEventListener('blur', onWindowBlur)
      ctx.logger.info('sync runtime start')
    },
    tick(ctx: RuntimeContext, dtSeconds: number) {
      const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Position)
      engine?.tick({
        connection: ctx.net?.getConnection() ?? null,
        identityHex: ctx.net?.getIdentityHex() ?? null,
        localPlayer: localPlayer ?? null,
        dtSeconds,
      })
    },
    stop(ctx: RuntimeContext) {
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

      engine?.resetAll()
      engine = null
      delete ctx.sync
      ctx.logger.info('sync runtime stop')
    },
  }
}
