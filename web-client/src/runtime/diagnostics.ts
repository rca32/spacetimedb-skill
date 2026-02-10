import { RuntimeContext, RuntimeModule } from './types'

export function createDiagnosticsRuntime(): RuntimeModule {
  let accumulated = 0

  return {
    name: 'DiagnosticsRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('diagnostics runtime start')
    },
    tick(ctx: RuntimeContext, dtSeconds: number) {
      accumulated += dtSeconds
      if (accumulated >= 5) {
        ctx.logger.info('diagnostics heartbeat', { frame: ctx.frame, state: ctx.appState.value })
        accumulated = 0
      }
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('diagnostics runtime stop')
    },
  }
}
