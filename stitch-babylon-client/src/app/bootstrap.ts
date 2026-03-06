import { loadConfig } from '../infra/config'
import { createLogger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import { BabylonClientRuntime } from './runtime'

let activeRuntime: BabylonClientRuntime | null = null
let activeBeforeUnload: (() => void) | null = null

export async function bootstrap(root: HTMLElement | null): Promise<() => void> {
  if (!root) {
    throw new Error('Root element not found: #app')
  }

  if (activeBeforeUnload) {
    window.removeEventListener('beforeunload', activeBeforeUnload)
    activeBeforeUnload = null
  }

  if (activeRuntime) {
    await activeRuntime.stop()
    activeRuntime = null
  }

  const config = loadConfig()
  const logger = createLogger('stitch-babylon-client')
  const tokenStore = new TokenStore(config.tokenStorageKey)

  const runtime = new BabylonClientRuntime(root, config, logger, tokenStore)
  await runtime.start()
  activeRuntime = runtime

  const handleBeforeUnload = () => {
    if (activeRuntime === runtime) {
      activeRuntime = null
    }
    void runtime.stop()
  }
  activeBeforeUnload = handleBeforeUnload
  window.addEventListener('beforeunload', handleBeforeUnload)

  return async () => {
    if (activeBeforeUnload === handleBeforeUnload) {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      activeBeforeUnload = null
    }
    if (activeRuntime === runtime) {
      activeRuntime = null
    }
    await runtime.stop()
  }
}
