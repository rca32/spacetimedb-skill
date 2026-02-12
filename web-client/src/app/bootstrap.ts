import { createCoreWorld } from '../core/world'
import { loadConfig } from '../infra/config'
import { createLogger } from '../infra/logging'
import { TokenStore } from '../infra/token-store'
import { AssetLoader } from '../render/asset-loader'
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

  context.appState.transition('LoadingAssets')
  await preloadCriticalAssets(context)
  context.appState.transition('Connecting')

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
    AssetLoader.dispose()
  }

  window.addEventListener('beforeunload', () => {
    void shutdown()
  })
}

async function preloadCriticalAssets(context: RuntimeContext): Promise<void> {
  try {
    const result = await AssetLoader.loadCriticalAssets()
    context.logger.info('critical assets loaded', {
      manifestVersion: result.manifest.version,
      models: result.models.size,
      textures: result.textures.size,
      audioBuffers: result.audioBuffers.size,
    })
  } catch (error) {
    context.logger.warn('critical asset preload failed; continue with primitive fallback', {
      error: toErrorMessage(error),
    })
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
