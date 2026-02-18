import { loadConfig } from '../infra/config'
import { createLogger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import { OrillusionClientRuntime } from './runtime'

export async function bootstrap(root: HTMLElement | null): Promise<void> {
  if (!root) {
    throw new Error('Root element not found: #app')
  }

  const config = loadConfig()
  const logger = createLogger('stitch-orillusion-client')
  const tokenStore = new TokenStore(config.tokenStorageKey)

  const runtime = new OrillusionClientRuntime(root, config, logger, tokenStore)
  await runtime.start()

  window.addEventListener('beforeunload', () => {
    runtime.stop()
  })
}
