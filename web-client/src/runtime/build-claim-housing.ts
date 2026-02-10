import { RuntimeContext, RuntimeModule } from './types'

export function createBuildClaimHousingRuntime(): RuntimeModule {
  return {
    name: 'BuildClaimHousingRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('build-claim-housing runtime start')
    },
    tick() {
      // Phase 6에서 reducer intent + read model 연결
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('build-claim-housing runtime stop')
    },
  }
}
