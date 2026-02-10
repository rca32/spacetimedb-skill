import { RuntimeContext, RuntimeModule } from './types'

export function createSyncRuntime(): RuntimeModule {
  return {
    name: 'SyncRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('sync runtime start')
    },
    tick() {
      // Phase 4에서 movement/combat prediction and reconciliation 연결
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('sync runtime stop')
    },
  }
}
