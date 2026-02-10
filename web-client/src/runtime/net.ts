import { createNetConnectionRuntime } from '../net/connection'
import { NetEventQueue } from '../net/events'
import { ReducerIntentQueue } from '../net/reducers'
import { SubscriptionRegistry } from '../net/subscriptions'
import { RuntimeContext, RuntimeModule } from './types'

const BASELINE_SUBSCRIPTIONS: Array<{ key: string; queries: string[] }> = [
  {
    key: 'session-baseline',
    queries: ['SELECT * FROM player_session_view'],
  },
  {
    key: 'movement-feedback',
    queries: ['SELECT * FROM player_movement_feedback_view'],
  },
]

export function createNetRuntime(): RuntimeModule {
  const events = new NetEventQueue()
  const subscriptions = new SubscriptionRegistry()
  const reducerQueue = new ReducerIntentQueue()
  let runtime: ReturnType<typeof createNetConnectionRuntime> | null = null

  return {
    name: 'NetRuntime',
    async start(ctx: RuntimeContext) {
      for (const baseline of BASELINE_SUBSCRIPTIONS) {
        subscriptions.register(baseline.key, baseline.queries)
      }

      runtime = createNetConnectionRuntime(ctx.config, ctx.logger, ctx.tokenStore, events)
      await runtime.connect()

      ctx.logger.info('net runtime start', {
        subscriptions: subscriptions.values(),
      })
    },
    tick(ctx: RuntimeContext) {
      runtime?.poll()

      for (const event of events.drain()) {
        switch (event.kind) {
          case 'connected': {
            if (ctx.appState.value === 'Connecting') {
              ctx.appState.transition('Authenticating')
              enqueueInitialAuth(reducerQueue)
            }

            const connection = runtime?.getConnection()
            if (connection) {
              subscriptions.activateAll(connection, {
                onApplied: (key) => events.push({ kind: 'subscription-applied', key }),
                onError: (key, error) => events.push({ kind: 'subscription-error', key, error }),
              })
            }

            ctx.logger.info('spacetimedb connected', { identity: event.identityHex })
            break
          }

          case 'connect-error': {
            transitionToReconnecting(ctx)
            ctx.logger.warn('spacetimedb connect error', { error: event.error.message })
            break
          }

          case 'disconnected': {
            subscriptions.deactivateAll()
            transitionToReconnecting(ctx)
            ctx.logger.warn('spacetimedb disconnected', {
              error: event.error?.message,
            })
            break
          }

          case 'reconnect-scheduled': {
            ctx.logger.warn('spacetimedb reconnect scheduled', {
              retryCount: event.retryCount,
              delayMs: event.delayMs,
            })
            break
          }

          case 'subscription-applied': {
            if (ctx.appState.value === 'Authenticating') {
              ctx.appState.transition('CharacterReady')
              ctx.appState.transition('InWorld')
            } else if (ctx.appState.value === 'Reconnecting') {
              ctx.appState.transition('InWorld')
            }

            ctx.logger.info('subscription applied', { key: event.key })
            break
          }

          case 'subscription-error': {
            ctx.logger.error('subscription failed', {
              key: event.key,
              error: event.error.message,
            })
            break
          }

          case 'reducer-dispatched': {
            ctx.logger.debug('reducer dispatched', { reducer: event.reducer })
            break
          }

          case 'reducer-failed': {
            ctx.logger.warn('reducer dispatch failed', {
              reducer: event.reducer,
              error: event.error.message,
            })
            break
          }
        }
      }

      for (const intent of reducerQueue.drain()) {
        runtime?.dispatchReducer(intent.name, intent.payload)
      }
    },
    stop(ctx: RuntimeContext) {
      subscriptions.clear()
      runtime?.disconnect()
      ctx.logger.info('net runtime stop')
    },
  }
}

function enqueueInitialAuth(queue: ReducerIntentQueue): void {
  queue.enqueue({
    name: 'account_bootstrap',
    payload: { displayName: 'WebPlayer' },
  })

  queue.enqueue({
    name: 'sign_in',
    payload: { regionId: 1n },
  })
}

function transitionToReconnecting(ctx: RuntimeContext): void {
  if (
    ctx.appState.value === 'Connecting' ||
    ctx.appState.value === 'Authenticating' ||
    ctx.appState.value === 'CharacterReady' ||
    ctx.appState.value === 'InWorld'
  ) {
    ctx.appState.transition('Reconnecting')
  }
}
