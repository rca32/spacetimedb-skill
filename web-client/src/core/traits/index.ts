import { trait } from 'koota'

export type WorldObjectKindType =
  | 'Player'
  | 'Npc'
  | 'Building'
  | 'ResourceNode'
  | 'TerrainChunk'
  | 'Claim'

export const Position = trait({ x: 0, y: 0, z: 0 })
export const Rotation = trait({ x: 0, y: 0, z: 0, w: 1 })
export const Velocity = trait({ x: 0, y: 0, z: 0 })
export const PresentationTransform = trait({
  x: 0,
  y: 0,
  z: 0,
  qx: 0,
  qy: 0,
  qz: 0,
  qw: 1,
})
export const NetEntity = trait({ table: '', serverId: '' })
export const WorldObjectKind = trait({ kind: 'Player' as WorldObjectKindType })
export const ChunkData = trait({ chunkX: 0, chunkY: 0, biomeId: 0, chunkSize: 16 })
export const BuildingData = trait({
  state: 0,
  buildProgress: 0,
  buildRequired: 0,
  requiredItemDefId: '0',
})
export const ClaimData = trait({
  radius: 0,
  tier: 0,
  ownerIdentityHex: '',
  totemBuildingId: '',
  regionId: '',
})
export const ResourceData = trait({ resourceType: 0, amount: 0, maxAmount: 0, isDepleted: false })

export const InventoryContainerViewData = trait({
  ownerIdentityHex: '',
  containerId: '',
  slotCount: 0,
  itemPocketVolume: 0,
  cargoPocketVolume: 0,
})
export const InventorySlotViewData = trait({
  slotKey: '',
  ownerIdentityHex: '',
  containerId: '',
  slotIndex: 0,
  itemInstanceId: '',
  locked: false,
  itemType: 0,
  volume: 0,
})
export const InventoryItemViewData = trait({
  itemInstanceId: '',
  ownerIdentityHex: '',
  containerId: '',
  slotIndex: 0,
  itemDefId: '',
  quantity: 0,
  durability: 0,
  bound: false,
})
export const WalletData = trait({
  identityHex: '',
  balance: '0',
  updatedAt: '',
})
export const TradeSessionData = trait({
  sessionId: '',
  initiatorIdentityHex: '',
  partnerIdentityHex: '',
  regionId: '',
  phase: 0,
  initiatorAccepted: false,
  partnerAccepted: false,
  updatedAt: '',
})
export const TradeOfferData = trait({
  offerKey: '',
  sessionId: '',
  ownerIdentityHex: '',
  itemInstanceId: '',
  quantity: 0,
  updatedAt: '',
})
export const MarketOrderData = trait({
  orderId: '',
  ownerIdentityHex: '',
  regionId: '',
  side: 0,
  itemDefId: '',
  quantityOpen: 0,
  unitPrice: '0',
  status: 0,
  updatedAt: '',
})
export const MarketFillData = trait({
  fillId: '',
  buyOrderId: '',
  sellOrderId: '',
  itemDefId: '',
  quantity: 0,
  unitPrice: '0',
  buyerIdentityHex: '',
  sellerIdentityHex: '',
  createdAt: '',
})
export const PriceIndexData = trait({
  indexKey: '',
  itemDefId: '',
  priceAvg: '0',
  volume: '0',
  recordedAt: '',
})
export const ItemDefData = trait({
  itemDefId: '',
  category: 0,
  rarity: 0,
  maxStack: 0,
  volume: 0,
})

export const ThreeObjectRef = trait(() => ({
  object3d: undefined as unknown | undefined,
}))

export const IsLocalPlayer = trait()
export const IsRemotePlayer = trait()
export const IsNpc = trait()
export const IsBuilding = trait()
export const IsResourceNode = trait()
export const IsTerrainChunk = trait()
export const IsClaim = trait()
export const IsInventoryView = trait()
export const IsTradeEntity = trait()
export const IsEconomyEntity = trait()
