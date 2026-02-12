import { AppStateStore } from '../app/app-state'
import { CoreWorld } from '../core/world'
import { AppConfig } from '../infra/config'
import { Logger } from '../infra/logging'
import { DbConnection } from '../module_bindings'
import { TokenStore } from '../infra/token-store'
import { RendererRuntime } from '../render/renderer'
import type { SyncDiagnosticsSnapshot } from './sync-engine'

export interface NetRuntimeBridge {
  getConnection: () => DbConnection | null
  getIdentityHex: () => string | null
  setSubscription: (key: string, queries: string[]) => void
  removeSubscription: (key: string) => void
}

export interface RuntimeContext {
  root: HTMLElement
  config: AppConfig
  logger: Logger
  tokenStore: TokenStore
  appState: AppStateStore
  world: CoreWorld
  renderer: RendererRuntime
  net?: NetRuntimeBridge
  sync?: {
    getDiagnostics: () => SyncDiagnosticsSnapshot
  }
  frame: number
}

export interface RuntimeModule {
  readonly name: string
  start: (ctx: RuntimeContext) => Promise<void> | void
  tick: (ctx: RuntimeContext, dtSeconds: number) => void
  stop: (ctx: RuntimeContext) => Promise<void> | void
}

export function createRuntimeModule(name: string): RuntimeModule {
  return {
    name,
    start: () => undefined,
    tick: () => undefined,
    stop: () => undefined,
  }
}
