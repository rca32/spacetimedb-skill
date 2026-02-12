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
  dispatchReducer: (name: string, payload: Record<string, unknown>) => boolean
  getReducerFailure: (name: string) => { message: string; atMs: number } | null
  clearReducerFailure: (name: string) => void
}

export interface InventoryContainerSnapshot {
  viewKey: string
  ownerIdentityHex: string
  containerId: string
  slotCount: number
  itemPocketVolume: number
  cargoPocketVolume: number
}

export interface InventorySlotSnapshot {
  slotKey: string
  ownerIdentityHex: string
  containerId: string
  slotIndex: number
  itemInstanceId: string
  locked: boolean
  itemType: number
  volume: number
}

export interface InventoryItemSnapshot {
  itemInstanceId: string
  ownerIdentityHex: string
  containerId: string
  slotIndex: number
  itemDefId: string
  quantity: number
  durability: number
  bound: boolean
}

export interface WalletSnapshot {
  identityHex: string
  balance: string
  updatedAt: string
}

export interface TradeSessionSnapshot {
  sessionId: string
  initiatorIdentityHex: string
  partnerIdentityHex: string
  regionId: string
  phase: number
  initiatorAccepted: boolean
  partnerAccepted: boolean
  updatedAt: string
}

export interface TradeOfferSnapshot {
  offerKey: string
  sessionId: string
  ownerIdentityHex: string
  itemInstanceId: string
  quantity: number
  updatedAt: string
}

export interface MarketOrderSnapshot {
  orderId: string
  ownerIdentityHex: string
  regionId: string
  side: number
  itemDefId: string
  quantityOpen: number
  unitPrice: string
  status: number
  updatedAt: string
}

export interface MarketFillSnapshot {
  fillId: string
  buyOrderId: string
  sellOrderId: string
  itemDefId: string
  quantity: number
  unitPrice: string
  buyerIdentityHex: string
  sellerIdentityHex: string
  createdAt: string
}

export interface PriceIndexSnapshot {
  indexKey: string
  itemDefId: string
  priceAvg: string
  volume: string
  recordedAt: string
}

export interface ItemDefSnapshot {
  itemDefId: string
  category: number
  rarity: number
  maxStack: number
  volume: number
}

export interface TradePartnerCandidate {
  identityHex: string
}

export interface InventoryTradeSnapshot {
  connected: boolean
  identityHex: string | null
  generatedAtMs: number
  containers: InventoryContainerSnapshot[]
  slots: InventorySlotSnapshot[]
  items: InventoryItemSnapshot[]
  wallet: WalletSnapshot | null
  tradeSessions: TradeSessionSnapshot[]
  tradeOffers: TradeOfferSnapshot[]
  marketOrders: MarketOrderSnapshot[]
  marketFills: MarketFillSnapshot[]
  priceIndex: PriceIndexSnapshot[]
  itemDefs: ItemDefSnapshot[]
  tradePartners: TradePartnerCandidate[]
}

export interface InventoryTradeActionResult {
  ok: boolean
  error?: string
}

export interface InventoryTradeActions {
  bootstrapInventory: () => InventoryTradeActionResult
  moveItemStack: (input: {
    containerId: string
    fromSlotIndex: number
    toSlotIndex: number
    quantity: number
  }) => InventoryTradeActionResult
  openTradeSession: (input: {
    partnerIdentityHex: string
    sessionId?: string
  }) => InventoryTradeActionResult
  addTradeItem: (input: {
    sessionId: string
    itemInstanceId: string
    quantity: number
  }) => InventoryTradeActionResult
  setTradeAccept: (input: {
    sessionId: string
    accepted: boolean
  }) => InventoryTradeActionResult
  placeMarketOrder: (input: {
    side: number
    itemDefId: string
    quantity: number
    unitPrice: string
    orderId?: string
  }) => InventoryTradeActionResult
  cancelMarketOrder: (input: {
    orderId: string
  }) => InventoryTradeActionResult
  matchMarketOrderTestOnly: (input: {
    buyOrderId: string
    sellOrderId: string
    quantity: number
  }) => InventoryTradeActionResult
}

export interface InventoryTradeRuntimeBridge {
  getSnapshot: () => InventoryTradeSnapshot
  actions: InventoryTradeActions
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
  inventoryTrade?: InventoryTradeRuntimeBridge
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
