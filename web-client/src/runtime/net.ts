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
  const subscriptionLastAppliedAtMs = new Map<string, number>()
  const subscriptionLastError = new Map<string, { message: string; atMs: number }>()
  const reducerFailures = new Map<string, { message: string; atMs: number }>()
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
        getSubscriptionDiagnostics: () => {
          const keys = subscriptions.snapshot().map((entry) => {
            const lastError = subscriptionLastError.get(entry.key) ?? null
            return {
              key: entry.key,
              queryCount: entry.queryCount,
              active: entry.active,
              appliedCount: subscriptionAppliedCount.get(entry.key) ?? 0,
              lastAppliedAtMs: subscriptionLastAppliedAtMs.get(entry.key) ?? null,
              lastError: lastError?.message ?? null,
              lastErrorAtMs: lastError?.atMs ?? null,
            }
          })

          return {
            generatedAtMs: Date.now(),
            keys,
          }
        },
        dispatchReducer: (name, payload) => {
          reducerFailures.delete(name)
          return runtime?.dispatchReducer(name, payload) ?? false
        },
        getReducerFailure: (name) => reducerFailures.get(name) ?? null,
        clearReducerFailure: (name) => {
          reducerFailures.delete(name)
        },
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
          subscriptionAppliedCount.delete(key)
          subscriptionLastAppliedAtMs.delete(key)
          subscriptionLastError.delete(key)
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
              // Keep this query filter-free for SQL compatibility across SpacetimeDB versions.
              // Client-side identity filtering is already applied in SyncEngine/UI.
              const movementFeedbackQuery = 'SELECT * FROM player_movement_feedback_view'
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
            subscriptionLastAppliedAtMs.set(event.key, Date.now())
            subscriptionLastError.delete(event.key)

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
            subscriptionLastError.set(event.key, {
              message: event.error.message,
              atMs: Date.now(),
            })
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
            reducerFailures.set(event.reducer, {
              message: event.error.message,
              atMs: Date.now(),
            })
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
      subscriptionLastAppliedAtMs.clear()
      subscriptionLastError.clear()
      reducerFailures.clear()
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
