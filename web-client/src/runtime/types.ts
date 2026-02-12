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

export interface BuildingDefSnapshot {
  buildingDefId: string
  requiredItemDefId: string
  requiredItemQty: number
  buildRequired: number
  footprintRadius: number
}

export interface BuildingStateSnapshot {
  entityId: string
  ownerIdentityHex: string
  regionId: string
  hexX: number
  hexZ: number
  state: number
  requiredItemDefId: string
  requiredItemQty: number
  buildProgress: number
  buildRequired: number
  createdAt: string
  updatedAt: string
}

export interface ClaimStateSnapshot {
  claimId: string
  ownerIdentityHex: string
  totemBuildingId: string
  regionId: string
  centerX: number
  centerZ: number
  radius: number
  tier: number
  createdAt: string
  updatedAt: string
}

export interface HousingStateSnapshot {
  entityId: string
  ownerIdentityHex: string
  entranceBuildingEntityId: string
  exitPortalEntityId: string
  networkEntityId: string
  regionIndex: number
  lockedUntil: string
  isEmpty: boolean
}

export interface DimensionNetworkSnapshot {
  entityId: string
  buildingId: string
  collapseRespawnTimestamp: string
}

export interface DimensionDescSnapshot {
  entityId: string
  dimensionId: number
  networkEntityId: string
  interiorInstanceId: string
  collapseTimestamp: string
}

export interface RentStateSnapshot {
  entityId: string
  whiteListIdentityHexes: string[]
}

export interface InteriorCollapseTimerSnapshot {
  scheduledId: string
  scheduledAt: string
  housingEntityId: string
}

export interface IdLeaseSnapshot {
  leaseKey: string
  identityHex: string
  kind: number
  requestNonce: string
  leasedId: string
  updatedAt: string
}

export interface BuildClaimHousingSnapshot {
  connected: boolean
  identityHex: string | null
  generatedAtMs: number
  buildingDefs: BuildingDefSnapshot[]
  buildings: BuildingStateSnapshot[]
  claims: ClaimStateSnapshot[]
  housings: HousingStateSnapshot[]
  dimensionNetworks: DimensionNetworkSnapshot[]
  dimensionDescs: DimensionDescSnapshot[]
  rents: RentStateSnapshot[]
  interiorTimers: InteriorCollapseTimerSnapshot[]
  leases: IdLeaseSnapshot[]
  lastStatus: string
}

export interface BuildClaimHousingActionResult {
  ok: boolean
  error?: string
}

export interface BuildClaimHousingActions {
  placeBuilding: (input: {
    regionId: number
    hexX: number
    hexZ: number
    buildingDefId: string
    buildingId?: string
  }) => BuildClaimHousingActionResult
  advanceBuilding: (input: {
    buildingId: string
    steps: number
  }) => BuildClaimHousingActionResult
  deconstructBuilding: (input: {
    buildingId: string
  }) => BuildClaimHousingActionResult
  placeClaimTotem: (input: {
    totemBuildingId: string
    radius: number
    claimId?: string
  }) => BuildClaimHousingActionResult
  expandClaim: (input: {
    claimId: string
    radiusDelta: number
  }) => BuildClaimHousingActionResult
  createHousing: (input: {
    entranceBuildingEntityId: string
    dimensionId: number
    interiorInstanceId: string
    housingEntityId?: string
    networkEntityId?: string
    dimensionEntityId?: string
  }) => BuildClaimHousingActionResult
  enterHousing: (input: {
    housingEntityId: string
    portalX: number
    portalY: number
    portalZ: number
  }) => BuildClaimHousingActionResult
  changeHousingEntrance: (input: {
    housingEntityId: string
    newEntranceBuildingEntityId: string
    targetRegionIndex: number
    movingMinutes: number
  }) => BuildClaimHousingActionResult
  markInteriorEmpty: (input: {
    housingEntityId: string
    isEmpty: boolean
    respawnDelaySeconds: number
  }) => BuildClaimHousingActionResult
  propagateHousingPermissions: (input: {
    housingEntityId: string
    subjectIdentityHex: string
    grantUse: boolean
    grantBuild: boolean
    grantAdmin: boolean
  }) => BuildClaimHousingActionResult
  setRentWhitelist: (input: {
    housingEntityId: string
    whiteListIdentityHexes: string[]
  }) => BuildClaimHousingActionResult
}

export interface BuildClaimHousingRuntimeBridge {
  getSnapshot: () => BuildClaimHousingSnapshot
  actions: BuildClaimHousingActions
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
  buildClaimHousing?: BuildClaimHousingRuntimeBridge
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
