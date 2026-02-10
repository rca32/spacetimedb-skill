import { RuntimeContext, RuntimeModule } from './types'

export function createWorldRuntime(): RuntimeModule {
  return {
    name: 'WorldRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('world runtime start')
    },
    tick() {
      // Phase 3에서 AOI and entity sync 연결
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('world runtime stop')
    },
  }
}
