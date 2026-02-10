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
        const stats = ctx.renderer.getStats()
        ctx.logger.info('diagnostics heartbeat', {
          frame: ctx.frame,
          state: ctx.appState.value,
          drawCalls: stats.calls,
          triangles: stats.triangles,
        })
        if (stats.calls > 100) {
          ctx.logger.warn('draw call budget exceeded', {
            drawCalls: stats.calls,
            budget: 100,
          })
        }
        accumulated = 0
      }
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('diagnostics runtime stop')
    },
  }
}
