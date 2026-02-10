import { createNetConnectionRuntime } from '../net/connection'
import { NetEventQueue } from '../net/events'
import { ReducerIntentQueue } from '../net/reducers'
import { SubscriptionRegistry } from '../net/subscriptions'
import { RuntimeContext, RuntimeModule } from './types'

const BASELINE_SUBSCRIPTIONS: Array<{ key: string; queries: string[] }> = []
const ENABLE_MOVEMENT_FEEDBACK_SUBSCRIPTION = (import.meta.env.VITE_ENABLE_MOVEMENT_FEEDBACK_SUB ?? '0') === '1'

export function createNetRuntime(): RuntimeModule {
  const events = new NetEventQueue()
  const subscriptions = new SubscriptionRegistry()
  const reducerQueue = new ReducerIntentQueue()
  const subscriptionAppliedCount = new Map<string, number>()
  let runtime: ReturnType<typeof createNetConnectionRuntime> | null = null
  let identityHex: string | null = null

  const applyCallbacks = {
    onApplied: (key: string) => events.push({ kind: 'subscription-applied', key }),
    onError: (key: string, error: Error) => events.push({ kind: 'subscription-error', key, error }),
  }

  return {
    name: 'NetRuntime',
    async start(ctx: RuntimeContext) {
      for (const baseline of BASELINE_SUBSCRIPTIONS) {
        subscriptions.register(baseline.key, baseline.queries)
      }

      runtime = createNetConnectionRuntime(ctx.config, ctx.logger, ctx.tokenStore, events)

      ctx.net = {
        getConnection: () => runtime?.getConnection() ?? null,
        getIdentityHex: () => identityHex,
        setSubscription: (key, queries) => {
          const changed = subscriptions.register(key, queries)
          if (!changed) {
            return
          }
          ctx.logger.debug('subscription updated', {
            key,
            queries,
          })
          const connection = runtime?.getConnection()
          if (connection?.isActive) {
            subscriptions.activate(connection, key, applyCallbacks)
          }
        },
        removeSubscription: (key) => {
          subscriptions.remove(key)
        },
      }

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
            identityHex = event.identityHex
            const sessionBaselineQuery = `SELECT * FROM player_session_view WHERE identity = ${toIdentityLiteral(
              event.identityHex,
            )}`
            subscriptions.register('session-baseline', [sessionBaselineQuery])

            if (ENABLE_MOVEMENT_FEEDBACK_SUBSCRIPTION) {
              const movementFeedbackQuery = `SELECT * FROM player_movement_feedback_view WHERE identity = ${toIdentityLiteral(
                event.identityHex,
              )}`
              subscriptions.register('movement-feedback', [movementFeedbackQuery])
            }

            if (ctx.appState.value === 'Connecting') {
              ctx.appState.transition('Authenticating')
              enqueueInitialAuth(reducerQueue)
            }

            const connection = runtime?.getConnection()
            if (connection) {
              subscriptions.activateAll(connection, applyCallbacks)
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
            identityHex = null
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
            const appliedCount = (subscriptionAppliedCount.get(event.key) ?? 0) + 1
            subscriptionAppliedCount.set(event.key, appliedCount)

            if (ctx.appState.value === 'Authenticating') {
              ctx.appState.transition('CharacterReady')
              ctx.appState.transition('InWorld')
            } else if (ctx.appState.value === 'Reconnecting') {
              ctx.appState.transition('InWorld')
            }

            if (event.key === 'world-aoi') {
              ctx.logger.debug('subscription applied', { key: event.key, count: appliedCount })
            } else {
              ctx.logger.info('subscription applied', { key: event.key, count: appliedCount })
            }
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
      identityHex = null
      subscriptionAppliedCount.clear()
      subscriptions.clear()
      runtime?.disconnect()
      delete ctx.net
      ctx.logger.info('net runtime stop')
    },
  }
}

function enqueueInitialAuth(queue: ReducerIntentQueue): void {
  queue.enqueue({
    name: 'movement_feedback_cleanup_global',
    payload: { keepRowsPerIdentity: 64 },
  })

  queue.enqueue({
    name: 'account_bootstrap',
    payload: { displayName: 'WebPlayer' },
  })

  queue.enqueue({
    name: 'sign_in',
    payload: { regionId: 1n },
  })

  queue.enqueue({
    name: 'movement_feedback_cleanup',
    payload: { keepRows: 64 },
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

function toIdentityLiteral(identityHex: string): string {
  return `0x${identityHex}`
}
