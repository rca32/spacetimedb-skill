import { createNetConnectionRuntime } from '../net/connection'
import { NetEventQueue } from '../net/events'
import { SubscriptionRegistry } from '../net/subscriptions'
import { RuntimeContext, RuntimeModule } from './types'

export function createNetRuntime(): RuntimeModule {
  const events = new NetEventQueue()
  const subscriptions = new SubscriptionRegistry()
  let runtime: ReturnType<typeof createNetConnectionRuntime> | null = null

  return {
    name: 'NetRuntime',
    async start(ctx: RuntimeContext) {
      runtime = createNetConnectionRuntime(ctx.config, ctx.logger, ctx.tokenStore, events)
      await runtime.connect()
      subscriptions.add('baseline:player_session_view')
      ctx.logger.info('net runtime start', { subscriptions: subscriptions.values() })
    },
    tick(ctx: RuntimeContext) {
      runtime?.poll()

      for (const event of events.drain()) {
        if (event.kind === 'connected' && ctx.appState.value === 'Connecting') {
          ctx.appState.transition('Authenticating')
          ctx.appState.transition('CharacterReady')
          ctx.appState.transition('InWorld')
        }
        if (event.kind === 'disconnected' && ctx.appState.value === 'InWorld') {
          ctx.appState.transition('Reconnecting')
        }
      }
    },
    stop(ctx: RuntimeContext) {
      runtime?.disconnect()
      subscriptions.clear()
      ctx.logger.info('net runtime stop')
    },
  }
}
