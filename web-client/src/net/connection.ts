import { DbConnection } from '../module_bindings'
import { AppConfig } from '../infra/config'
import { Logger } from '../infra/logging'
import { TokenStore } from '../infra/token-store'
import { NetEventQueue } from './events'

const MAX_RECONNECT_DELAY_MS = 30_000
const BASE_RECONNECT_DELAY_MS = 1_000

export interface NetConnectionRuntime {
  connect: () => Promise<void>
  disconnect: () => void
  poll: () => void
  getConnection: () => DbConnection | null
  dispatchReducer: (reducerName: string, payload: Record<string, unknown>) => boolean
}

export function createNetConnectionRuntime(
  config: AppConfig,
  logger: Logger,
  tokenStore: TokenStore,
  events: NetEventQueue,
): NetConnectionRuntime {
  let connection: DbConnection | null = null
  let connecting = false
  let manualDisconnect = false
  let reconnectRetryCount = 0
  let reconnectAtMs: number | null = null

  const openConnection = async (): Promise<void> => {
    if (connecting || connection) {
      return
    }

    connecting = true
    const token = tokenStore.load() ?? undefined

    try {
      const builder = DbConnection.builder()
        .withUri(config.spacetimeUri)
        .withModuleName(config.spacetimeModuleName)
        .withToken(token)
        .onConnect((conn, identity, nextToken) => {
          connection = conn
          reconnectRetryCount = 0
          reconnectAtMs = null
          tokenStore.save(nextToken)
          events.push({ kind: 'connected', identityHex: identity.toHexString() })
        })
        .onConnectError((ctx, error) => {
          connection = null
          events.push({ kind: 'connect-error', error })
          scheduleReconnect(ctx.isActive)
        })
        .onDisconnect((ctx, error) => {
          connection = null
          events.push({ kind: 'disconnected', error })
          if (!manualDisconnect) {
            scheduleReconnect(ctx.isActive)
          }
        })

      builder.build()
      logger.info('network connect initiated', {
        uri: config.spacetimeUri,
        moduleName: config.spacetimeModuleName,
        hasToken: Boolean(token),
      })
    } finally {
      connecting = false
    }
  }

  const scheduleReconnect = (_wasActive: boolean): void => {
    if (manualDisconnect) {
      return
    }
    reconnectRetryCount += 1
    const delayMs = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** (reconnectRetryCount - 1), MAX_RECONNECT_DELAY_MS)
    reconnectAtMs = Date.now() + delayMs
    events.push({ kind: 'reconnect-scheduled', retryCount: reconnectRetryCount, delayMs })
  }

  return {
    async connect() {
      manualDisconnect = false
      await openConnection()
    },
    disconnect() {
      manualDisconnect = true
      reconnectAtMs = null
      reconnectRetryCount = 0
      if (connection) {
        connection.disconnect()
        connection = null
      }
    },
    poll() {
      if (manualDisconnect || connection || connecting || reconnectAtMs === null) {
        return
      }
      if (Date.now() < reconnectAtMs) {
        return
      }
      void openConnection()
    },
    getConnection() {
      return connection
    },
    dispatchReducer(reducerName, payload) {
      if (!connection || !connection.isActive) {
        return false
      }

      const reducerAccessor = toCamelCase(reducerName)
      const reducers = connection.reducers as unknown as Record<string, (params: unknown) => void>
      const reducer = reducers[reducerAccessor]
      if (!reducer) {
        events.push({
          kind: 'reducer-failed',
          reducer: reducerName,
          error: new Error(`Reducer not found: ${reducerAccessor}`),
        })
        return false
      }

      try {
        reducer(payload)
        events.push({ kind: 'reducer-dispatched', reducer: reducerName })
        return true
      } catch (error) {
        events.push({ kind: 'reducer-failed', reducer: reducerName, error: toError(error) })
        return false
      }
    },
  }
}

function toCamelCase(value: string): string {
  return value.replace(/[_-](\w)/g, (_, ch: string) => ch.toUpperCase())
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
