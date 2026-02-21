import { AppConfig } from '../infra/config'
import type { Logger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import { createNetConnectionRuntime } from './connection'
import { NetEventQueue } from './events'
import { SubscriptionRegistry } from './subscriptions'

const QUIET_REDUCER_LOGS = new Set([
  'sync_client_frame',
  'submit_motion_intent',
  'npc_talk',
  'npc_trade',
  'npc_quest',
  'npc_dialogue_request',
  'npc_action_resolve',
])

export class NetRuntime {
  private readonly events = new NetEventQueue()
  private readonly subscriptions = new SubscriptionRegistry()
  private readonly runtime
  private identityHex: string | null = null

  constructor(config: AppConfig, logger: Logger, tokenStore: TokenStore) {
    this.runtime = createNetConnectionRuntime(config, logger, tokenStore, this.events)
  }

  async start(): Promise<void> {
    await this.runtime.connect()
  }

  stop(): void {
    this.subscriptions.clear()
    this.identityHex = null
    this.runtime.disconnect()
  }

  poll(logger: Logger): void {
    this.runtime.poll()

    for (const event of this.events.drain()) {
      switch (event.kind) {
        case 'connected': {
          this.identityHex = event.identityHex
          const connection = this.runtime.getConnection()
          if (connection) {
            this.subscriptions.activateAll(connection, {
              onApplied: (key) => logger.debug('subscription applied', { key }),
              onError: (key, error) => logger.error('subscription error', { key, error: error.message }),
            })
          }
          logger.info('connected', { identityHex: event.identityHex })
          break
        }

        case 'disconnected': {
          this.identityHex = null
          this.subscriptions.deactivateAll()
          logger.warn('disconnected', { error: event.error?.message })
          break
        }

        case 'connect-error': {
          logger.error('connect error', { error: event.error.message })
          break
        }

        case 'reconnect-scheduled': {
          logger.warn('reconnect scheduled', { retryCount: event.retryCount, delayMs: event.delayMs })
          break
        }

        case 'subscription-applied':
        case 'subscription-error': {
          // handled through callbacks/logging in other layers
          break
        }

        case 'reducer-dispatched': {
          if (!QUIET_REDUCER_LOGS.has(event.reducer)) {
            logger.debug('reducer dispatched', { reducer: event.reducer })
          }
          break
        }

        case 'reducer-failed': {
          logger.error('reducer dispatch failed', { reducer: event.reducer, error: event.error.message })
          break
        }
      }
    }
  }

  getIdentityHex(): string | null {
    return this.identityHex
  }

  getConnection() {
    return this.runtime.getConnection()
  }

  setSubscription(key: string, queries: string[], logger: Logger): void {
    const changed = this.subscriptions.register(key, queries)
    if (!changed) {
      return
    }

    const connection = this.runtime.getConnection()
    if (connection?.isActive) {
      this.subscriptions.activate(connection, key, {
        onApplied: (appliedKey) => logger.debug('subscription applied', { key: appliedKey }),
        onError: (errorKey, error) => logger.error('subscription error', { key: errorKey, error: error.message }),
      })
    }
  }

  removeSubscription(key: string): void {
    this.subscriptions.remove(key)
  }

  dispatchReducer(reducerName: string, payload: Record<string, unknown>): boolean {
    return this.runtime.dispatchReducer(reducerName, payload)
  }
}
