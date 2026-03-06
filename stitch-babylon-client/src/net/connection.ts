import type { AppConfig } from '../infra/config'
import type { Logger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import { DbConnection } from '../module_bindings'
import { NetEventQueue } from './events'
import { SubscriptionSetRegistry } from './subscriptions'

const MAX_RECONNECT_DELAY_MS = 30_000
const BASE_RECONNECT_DELAY_MS = 1_000

export class SpacetimeConnectionController {
  private readonly events = new NetEventQueue()
  private readonly subscriptions = new SubscriptionSetRegistry()
  private connection: DbConnection | null = null
  private identityHex: string | null = null
  private connecting = false
  private manualDisconnect = false
  private reconnectRetryCount = 0
  private reconnectAtMs: number | null = null

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly tokenStore: TokenStore,
  ) {}

  async connect(): Promise<void> {
    this.manualDisconnect = false
    await this.openConnection()
  }

  disconnect(): void {
    this.manualDisconnect = true
    this.reconnectAtMs = null
    this.reconnectRetryCount = 0
    this.identityHex = null
    this.subscriptions.clear()
    this.connection?.disconnect()
    this.connection = null
  }

  poll(): void {
    if (this.manualDisconnect || this.connection || this.connecting || this.reconnectAtMs === null) {
      return
    }
    if (Date.now() < this.reconnectAtMs) {
      return
    }
    void this.openConnection()
  }

  getConnection(): DbConnection | null {
    return this.connection
  }

  getIdentityHex(): string | null {
    return this.identityHex
  }

  drainEvents() {
    return this.events.drain()
  }

  setSubscription(key: string, queries: string[], requiredForWorldReady: boolean): void {
    const changed = this.subscriptions.register(key, queries, requiredForWorldReady)
    if (!changed) {
      return
    }
    if (this.connection?.isActive) {
      this.subscriptions.activate(this.connection, key, {
        onApplied: (appliedKey) => this.events.push({ kind: 'subscription-applied', key: appliedKey }),
        onError: (errorKey, error) =>
          this.events.push({ kind: 'subscription-error', key: errorKey, reason: error.message }),
      })
    }
  }

  removeSubscription(key: string): void {
    this.subscriptions.remove(key)
  }

  getRequiredSubscriptionKeys(): string[] {
    return this.subscriptions.getRequiredKeys()
  }

  dispatchReducer(reducerName: string, payload: Record<string, unknown>, requestId?: string): boolean {
    const connection = this.connection
    if (!connection || !connection.isActive) {
      this.events.push({
        kind: 'reducer-result',
        reducer: reducerName,
        ok: false,
        requestId,
        reason: 'connection is not active',
      })
      return false
    }

    const reducerAccessor = toCamelCase(reducerName)
    const reducers = connection.reducers as unknown as Record<string, (params: unknown) => void>
    const reducer = reducers[reducerAccessor]
    if (!reducer) {
      this.events.push({
        kind: 'reducer-result',
        reducer: reducerName,
        ok: false,
        requestId,
        reason: `Reducer not found: ${reducerAccessor}`,
      })
      return false
    }

    try {
      reducer(payload)
      this.events.push({ kind: 'reducer-result', reducer: reducerName, ok: true, requestId })
      return true
    } catch (error) {
      this.events.push({
        kind: 'reducer-result',
        reducer: reducerName,
        ok: false,
        requestId,
        reason: toError(error).message,
      })
      return false
    }
  }

  private async openConnection(): Promise<void> {
    if (this.connecting || this.connection) {
      return
    }

    this.connecting = true
    const token = this.tokenStore.load() ?? undefined

    try {
      DbConnection.builder()
        .withUri(this.config.spacetimeUri)
        .withModuleName(this.config.spacetimeModuleName)
        .withToken(token)
        .onConnect((connection, identity, nextToken) => {
          this.connection = connection
          this.identityHex = identity.toHexString().replace(/^0x/, '')
          this.reconnectRetryCount = 0
          this.reconnectAtMs = null
          this.tokenStore.save(nextToken)
          this.subscriptions.activateAll(connection, {
            onApplied: (key) => this.events.push({ kind: 'subscription-applied', key }),
            onError: (key, error) => this.events.push({ kind: 'subscription-error', key, reason: error.message }),
          })
          this.events.push({ kind: 'connected', identityHex: this.identityHex })
        })
        .onConnectError((context, error) => {
          this.connection = null
          this.identityHex = null
          this.events.push({ kind: 'connect-error', reason: error.message })
          this.scheduleReconnect(context.isActive)
        })
        .onDisconnect((context, error) => {
          this.connection = null
          this.identityHex = null
          this.events.push({ kind: 'disconnected', reason: error?.message ?? 'connection closed' })
          if (!this.manualDisconnect) {
            this.scheduleReconnect(context.isActive)
          }
        })
        .build()

      this.logger.info('network connect initiated', {
        uri: this.config.spacetimeUri,
        moduleName: this.config.spacetimeModuleName,
        hasToken: Boolean(token),
      })
    } finally {
      this.connecting = false
    }
  }

  private scheduleReconnect(_wasActive: boolean): void {
    if (this.manualDisconnect) {
      return
    }

    this.reconnectRetryCount += 1
    const delayMs = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** (this.reconnectRetryCount - 1), MAX_RECONNECT_DELAY_MS)
    this.reconnectAtMs = Date.now() + delayMs
    this.events.push({ kind: 'reconnect-scheduled', retryCount: this.reconnectRetryCount, delayMs })
  }
}

function toCamelCase(value: string): string {
  return value.replace(/[_-](\w)/g, (_, char: string) => char.toUpperCase())
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
