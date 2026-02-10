import { RuntimeContext, RuntimeModule } from './types'

export function createSocialNpcQuestRuntime(): RuntimeModule {
  return {
    name: 'SocialNpcQuestRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('social-npc-quest runtime start')
    },
    tick() {
      // Phase 7에서 social/npc/quest read model 연결
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('social-npc-quest runtime stop')
    },
  }
}
