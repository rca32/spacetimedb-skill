import { AppConfig } from '../infra/config'
import { Logger } from '../infra/logging'
import { TokenStore } from '../infra/token-store'
import { NetEventQueue } from './events'

export interface NetConnectionRuntime {
  connect: () => Promise<void>
  disconnect: () => void
  poll: () => void
}

export function createNetConnectionRuntime(
  config: AppConfig,
  logger: Logger,
  tokenStore: TokenStore,
  events: NetEventQueue,
): NetConnectionRuntime {
  let connected = false

  return {
    async connect() {
      const token = tokenStore.load()
      logger.info('network connect requested', {
        uri: config.spacetimeUri,
        moduleName: config.spacetimeModuleName,
        hasToken: Boolean(token),
      })

      // Phase 1: 실제 SpacetimeDB 연결은 Phase 2에서 DbConnection.builder로 교체한다.
      connected = true
      events.push({ kind: 'connected' })
    },
    disconnect() {
      if (!connected) {
        return
      }
      connected = false
      events.push({ kind: 'disconnected' })
    },
    poll() {
      if (!connected) {
        return
      }
      // Phase 2에서 SDK frame pump로 교체한다.
    },
  }
}
