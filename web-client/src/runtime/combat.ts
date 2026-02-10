import { RuntimeContext, RuntimeModule } from './types'

export function createCombatRuntime(): RuntimeModule {
  return {
    name: 'CombatRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('combat runtime start')
    },
    tick() {
      // Phase 4에서 attack state machine 연결
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('combat runtime stop')
    },
  }
}
