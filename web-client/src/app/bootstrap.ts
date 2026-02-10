import { createCoreWorld } from '../core/world'
import { loadConfig } from '../infra/config'
import { createLogger } from '../infra/logging'
import { TokenStore } from '../infra/token-store'
import { createRendererRuntime } from '../render/renderer'
import { createBuildClaimHousingRuntime } from '../runtime/build-claim-housing'
import { createCombatRuntime } from '../runtime/combat'
import { createCoreRuntime } from '../runtime/core'
import { createDiagnosticsRuntime } from '../runtime/diagnostics'
import { createInventoryTradeRuntime } from '../runtime/inventory-trade'
import { createNetRuntime } from '../runtime/net'
import { createSocialNpcQuestRuntime } from '../runtime/social-npc-quest'
import { createSyncRuntime } from '../runtime/sync'
import { RuntimeContext, RuntimeModule } from '../runtime/types'
import { createUiRuntime } from '../runtime/ui'
import { createWorldRuntime } from '../runtime/world'
import { AppStateStore } from './app-state'

export async function bootstrap(root: HTMLElement | null): Promise<void> {
  if (!root) {
    throw new Error('Root element not found: #app')
  }

  root.style.position = 'relative'

  const config = loadConfig()
  const logger = createLogger(config.logLevel)
  const tokenStore = new TokenStore(config.tokenStorageKey)
  const appState = new AppStateStore()
  const world = createCoreWorld()
  const renderer = createRendererRuntime(root)

  const context: RuntimeContext = {
    root,
    config,
    logger,
    tokenStore,
    appState,
    world,
    renderer,
    frame: 0,
  }

  const modules: RuntimeModule[] = [
    createCoreRuntime(),
    createNetRuntime(),
    createSyncRuntime(),
    createWorldRuntime(),
    createCombatRuntime(),
    createInventoryTradeRuntime(),
    createBuildClaimHousingRuntime(),
    createSocialNpcQuestRuntime(),
    createUiRuntime(),
    createDiagnosticsRuntime(),
  ]

  for (const module of modules) {
    await module.start(context)
  }

  context.appState.transition('LoadingAssets')
  context.appState.transition('Connecting')

  context.renderer.start((dtSeconds) => {
    context.frame += 1
    for (const module of modules) {
      module.tick(context, dtSeconds)
    }
  })

  const shutdown = async () => {
    context.renderer.stop()
    for (const module of [...modules].reverse()) {
      await module.stop(context)
    }
  }

  window.addEventListener('beforeunload', () => {
    void shutdown()
  })
}
