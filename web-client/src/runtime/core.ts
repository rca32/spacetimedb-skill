import { runCoreSystems } from '../core/systems'
import { RuntimeContext, RuntimeModule } from './types'

export function createCoreRuntime(): RuntimeModule {
  return {
    name: 'CoreRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('core runtime start')
    },
    tick(ctx: RuntimeContext) {
      runCoreSystems(ctx.world)
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('core runtime stop')
    },
  }
}
