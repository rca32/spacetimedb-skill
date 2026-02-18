import { Identity } from 'spacetimedb'
import {
  InventoryContainerViewData,
  InventoryItemViewData,
  InventorySlotViewData,
  IsEconomyEntity,
  IsInventoryView,
  IsTradeEntity,
  ItemDefData,
  MarketFillData,
  MarketOrderData,
  PriceIndexData,
  TradeOfferData,
  TradeSessionData,
  WalletData,
} from '../core/traits'
import {
  InventoryTradeActionResult,
  InventoryTradeActions,
  InventoryTradeSnapshot,
  RuntimeContext,
  RuntimeModule,
} from './types'

const INVENTORY_TRADE_SUBSCRIPTION_KEY = 'inventory-trade-domain'
const ENABLE_MARKET_MATCH_TEST_ONLY =
  (import.meta.env.VITE_ENABLE_MARKET_MATCH_TEST ?? '0') === '1' || import.meta.env.DEV

type PlayerInventoryContainerViewRow = {
  viewKey: string
  ownerIdentity: unknown
  containerId: unknown
  slotCount: number
  itemPocketVolume: number
  cargoPocketVolume: number
}

type PlayerInventorySlotViewRow = {
  slotKey: string
  ownerIdentity: unknown
  containerId: unknown
  slotIndex: number
  itemInstanceId: unknown
  locked: boolean
  itemType: number
  volume: number
}

type PlayerInventoryItemViewRow = {
  itemInstanceId: unknown
  ownerIdentity: unknown
  containerId: unknown
  slotIndex: number
  itemDefId: unknown
  quantity: number
  durability: number
  bound: boolean
}

type PlayerWalletViewRow = {
  identity: unknown
  balance: unknown
  updatedAt: unknown
}

type TradeSessionRow = {
  sessionId: string
  initiatorIdentity: unknown
  partnerIdentity: unknown
  regionId: unknown
  dimensionId: number
  phase: number
  initiatorAccepted: boolean
  partnerAccepted: boolean
  updatedAt: unknown
}

type TradeOfferRow = {
  offerKey: string
  sessionId: string
  ownerIdentity: unknown
  itemInstanceId: unknown
  quantity: number
  updatedAt: unknown
}

type MarketOrderRow = {
  orderId: string
  ownerIdentity: unknown
  regionId: unknown
  side: number
  itemDefId: unknown
  quantityOpen: number
  unitPrice: unknown
  status: number
  updatedAt: unknown
}

type MarketFillRow = {
  fillId: string
  buyOrderId: string
  sellOrderId: string
  itemDefId: unknown
  quantity: number
  unitPrice: unknown
  buyerIdentity: unknown
  sellerIdentity: unknown
  createdAt: unknown
}

type PriceIndexRow = {
  indexKey: string
  itemDefId: unknown
  priceAvg: unknown
  volume: unknown
  recordedAt: unknown
}

type ItemDefRow = {
  itemDefId: unknown
  category: number
  rarity: number
  maxStack: number
  volume: number
}

type PlayerSessionViewRow = {
  identity: unknown
  regionId: bigint
  dimensionId: number
}

type TransformStateRow = {
  entityId: unknown
  regionId: bigint
  dimensionId: number
}

export function createInventoryTradeRuntime(): RuntimeModule {
  const knownKeys = new Map<string, Set<string>>()
  let snapshot: InventoryTradeSnapshot = createEmptySnapshot(false, null)
  let subscribedIdentityHex: string | null = null
  let bootstrappedIdentityHex: string | null = null
  let tradeSessionCounter = 0
  let marketOrderCounter = 0

  return {
    name: 'InventoryTradeRuntime',
    start(ctx: RuntimeContext) {
      ctx.inventoryTrade = {
        getSnapshot: () => snapshot,
        actions: createActions(
          ctx,
          () => `trd:${Date.now()}:${tradeSessionCounter++}`,
          () => `ord:${Date.now()}:${marketOrderCounter++}`,
        ),
      }
      ctx.logger.info('inventory-trade runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = normalizeIdentityHex(ctx.net?.getIdentityHex() ?? null)

      if (!connection || !connection.isActive || !localIdentityHex) {
        if (subscribedIdentityHex !== null) {
          ctx.net?.removeSubscription(INVENTORY_TRADE_SUBSCRIPTION_KEY)
        }
        subscribedIdentityHex = null
        bootstrappedIdentityHex = null
        clearDomainEntities(ctx, knownKeys)
        snapshot = createEmptySnapshot(false, localIdentityHex)
        return
      }

      if (subscribedIdentityHex !== localIdentityHex) {
        ctx.net?.setSubscription(INVENTORY_TRADE_SUBSCRIPTION_KEY, buildInventoryTradeQueries(localIdentityHex))
        subscribedIdentityHex = localIdentityHex
      }

      if (bootstrappedIdentityHex !== localIdentityHex) {
        const bootstrapped = ctx.net?.dispatchReducer('inventory_bootstrap', {}) ?? false
        if (!bootstrapped) {
          ctx.logger.warn('inventory_bootstrap dispatch failed')
        }
        bootstrappedIdentityHex = localIdentityHex
      }

      const containers = syncContainerViews(
        ctx,
        knownKeys,
        connection.db.playerInventoryContainerView.iter() as Iterable<PlayerInventoryContainerViewRow>,
      )
      const slots = syncSlotViews(
        ctx,
        knownKeys,
        connection.db.playerInventorySlotView.iter() as Iterable<PlayerInventorySlotViewRow>,
      )
      const items = syncItemViews(
        ctx,
        knownKeys,
        connection.db.playerInventoryItemView.iter() as Iterable<PlayerInventoryItemViewRow>,
      )
      const wallet = syncWalletView(ctx, knownKeys, connection.db.playerWalletView.iter() as Iterable<PlayerWalletViewRow>)
      const tradeSessions = syncTradeSessions(ctx, knownKeys, connection.db.tradeSession.iter() as Iterable<TradeSessionRow>)
      const tradeOffers = syncTradeOffers(ctx, knownKeys, connection.db.tradeOffer.iter() as Iterable<TradeOfferRow>)
      const marketOrders = syncMarketOrders(ctx, knownKeys, connection.db.marketOrder.iter() as Iterable<MarketOrderRow>)
      const marketFills = syncMarketFills(ctx, knownKeys, connection.db.marketFill.iter() as Iterable<MarketFillRow>)
      const priceIndex = syncPriceIndex(ctx, knownKeys, connection.db.priceIndex.iter() as Iterable<PriceIndexRow>)
      const itemDefs = syncItemDefs(ctx, knownKeys, connection.db.itemDef.iter() as Iterable<ItemDefRow>)
      const tradePartners = collectTradePartners(
        localIdentityHex,
        tradeSessions,
        connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>,
        connection.db.transformState.iter() as Iterable<TransformStateRow>,
      )

      snapshot = {
        connected: true,
        identityHex: localIdentityHex,
        generatedAtMs: Date.now(),
        containers,
        slots,
        items,
        wallet,
        tradeSessions,
        tradeOffers,
        marketOrders,
        marketFills,
        priceIndex,
        itemDefs,
        tradePartners,
      }
    },
    stop(ctx: RuntimeContext) {
      ctx.net?.removeSubscription(INVENTORY_TRADE_SUBSCRIPTION_KEY)
      clearDomainEntities(ctx, knownKeys)
      subscribedIdentityHex = null
      bootstrappedIdentityHex = null
      snapshot = createEmptySnapshot(false, null)
      delete ctx.inventoryTrade
      ctx.logger.info('inventory-trade runtime stop')
    },
  }
}

function createActions(
  ctx: RuntimeContext,
  nextTradeSessionId: () => string,
  nextMarketOrderId: () => string,
): InventoryTradeActions {
  return {
    bootstrapInventory: () => dispatchReducer(ctx, 'inventory_bootstrap', {}),
    moveItemStack: (input) => {
      if (input.quantity <= 0) {
        return failResult('quantity must be greater than zero')
      }
      const containerId = parseU64(input.containerId, 'containerId')
      if (containerId instanceof Error) {
        return failResult(containerId.message)
      }
      return dispatchReducer(ctx, 'item_stack_move', {
        containerId,
        fromSlotIndex: toU32(input.fromSlotIndex),
        toSlotIndex: toU32(input.toSlotIndex),
        quantity: toU32(input.quantity),
      })
    },
    openTradeSession: (input) => {
      const partnerIdentity = parseIdentity(input.partnerIdentityHex)
      if (partnerIdentity instanceof Error) {
        return failResult(partnerIdentity.message)
      }
      const sessionId = input.sessionId?.trim() || nextTradeSessionId()
      return dispatchReducer(ctx, 'trade_session_open', {
        sessionId,
        partnerIdentity,
      })
    },
    addTradeItem: (input) => {
      if (input.quantity <= 0) {
        return failResult('quantity must be greater than zero')
      }
      const itemInstanceId = parseU64(input.itemInstanceId, 'itemInstanceId')
      if (itemInstanceId instanceof Error) {
        return failResult(itemInstanceId.message)
      }
      return dispatchReducer(ctx, 'trade_item_add', {
        sessionId: input.sessionId.trim(),
        itemInstanceId,
        quantity: toU32(input.quantity),
      })
    },
    setTradeAccept: (input) =>
      dispatchReducer(ctx, 'trade_accept', {
        sessionId: input.sessionId.trim(),
        accepted: input.accepted,
      }),
    placeMarketOrder: (input) => {
      if (input.quantity <= 0) {
        return failResult('quantity must be greater than zero')
      }
      if (input.side !== 0 && input.side !== 1) {
        return failResult('side must be 0(buy) or 1(sell)')
      }
      const itemDefId = parseU64(input.itemDefId, 'itemDefId')
      if (itemDefId instanceof Error) {
        return failResult(itemDefId.message)
      }
      const unitPrice = parseU64(input.unitPrice, 'unitPrice')
      if (unitPrice instanceof Error) {
        return failResult(unitPrice.message)
      }
      const orderId = input.orderId?.trim() || nextMarketOrderId()
      return dispatchReducer(ctx, 'market_order_place', {
        orderId,
        side: input.side,
        itemDefId,
        quantity: toU32(input.quantity),
        unitPrice,
      })
    },
    cancelMarketOrder: (input) => dispatchReducer(ctx, 'market_order_cancel', { orderId: input.orderId.trim() }),
    matchMarketOrderTestOnly: (input) => {
      if (!ENABLE_MARKET_MATCH_TEST_ONLY) {
        return failResult('market_order_match is disabled outside test mode')
      }
      if (input.quantity <= 0) {
        return failResult('quantity must be greater than zero')
      }
      return dispatchReducer(ctx, 'market_order_match', {
        buyOrderId: input.buyOrderId.trim(),
        sellOrderId: input.sellOrderId.trim(),
        quantity: toU32(input.quantity),
      })
    },
  }
}

function dispatchReducer(
  ctx: RuntimeContext,
  reducerName: string,
  payload: Record<string, unknown>,
): InventoryTradeActionResult {
  const dispatched = ctx.net?.dispatchReducer(reducerName, payload) ?? false
  return dispatched ? { ok: true } : failResult(`failed to dispatch ${reducerName}`)
}

function createEmptySnapshot(connected: boolean, identityHex: string | null): InventoryTradeSnapshot {
  return {
    connected,
    identityHex,
    generatedAtMs: Date.now(),
    containers: [],
    slots: [],
    items: [],
    wallet: null,
    tradeSessions: [],
    tradeOffers: [],
    marketOrders: [],
    marketFills: [],
    priceIndex: [],
    itemDefs: [],
    tradePartners: [],
  }
}

function buildInventoryTradeQueries(identityHex: string): string[] {
  const identityLiteral = toIdentityLiteral(identityHex)
  return [
    `SELECT * FROM player_inventory_container_view WHERE owner_identity = ${identityLiteral}`,
    `SELECT * FROM player_inventory_slot_view WHERE owner_identity = ${identityLiteral}`,
    `SELECT * FROM player_inventory_item_view WHERE owner_identity = ${identityLiteral}`,
    `SELECT * FROM player_wallet_view WHERE identity = ${identityLiteral}`,
    `SELECT * FROM trade_session WHERE initiator_identity = ${identityLiteral}`,
    `SELECT * FROM trade_session WHERE partner_identity = ${identityLiteral}`,
    'SELECT * FROM trade_offer',
    'SELECT * FROM market_order',
    'SELECT * FROM market_fill',
    'SELECT * FROM price_index',
    'SELECT * FROM item_def',
    'SELECT * FROM player_session_view',
  ]
}

function syncContainerViews(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<PlayerInventoryContainerViewRow>,
): InventoryTradeSnapshot['containers'] {
  const table = 'player_inventory_container_view'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['containers'] = []

  for (const row of rows) {
    const ownerIdentityHex = identityHex(row.ownerIdentity)
    const containerId = toBigIntString(row.containerId)
    const key = `${table}:${row.viewKey}`
    seen.add(key)
    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsInventoryView, InventoryContainerViewData)
      entity.set(InventoryContainerViewData, {
        ownerIdentityHex,
        containerId,
        slotCount: row.slotCount,
        itemPocketVolume: row.itemPocketVolume,
        cargoPocketVolume: row.cargoPocketVolume,
      })
    })

    list.push({
      viewKey: row.viewKey,
      ownerIdentityHex,
      containerId,
      slotCount: row.slotCount,
      itemPocketVolume: row.itemPocketVolume,
      cargoPocketVolume: row.cargoPocketVolume,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => compareBigIntString(left.containerId, right.containerId))
  return list
}

function syncSlotViews(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<PlayerInventorySlotViewRow>,
): InventoryTradeSnapshot['slots'] {
  const table = 'player_inventory_slot_view'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['slots'] = []

  for (const row of rows) {
    const ownerIdentityHex = identityHex(row.ownerIdentity)
    const containerId = toBigIntString(row.containerId)
    const itemInstanceId = toBigIntString(row.itemInstanceId)
    const key = `${table}:${row.slotKey}`
    seen.add(key)
    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsInventoryView, InventorySlotViewData)
      entity.set(InventorySlotViewData, {
        slotKey: row.slotKey,
        ownerIdentityHex,
        containerId,
        slotIndex: row.slotIndex,
        itemInstanceId,
        locked: row.locked,
        itemType: row.itemType,
        volume: row.volume,
      })
    })

    list.push({
      slotKey: row.slotKey,
      ownerIdentityHex,
      containerId,
      slotIndex: row.slotIndex,
      itemInstanceId,
      locked: row.locked,
      itemType: row.itemType,
      volume: row.volume,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort(
    (left, right) =>
      compareBigIntString(left.containerId, right.containerId) || left.slotIndex - right.slotIndex || left.slotKey.localeCompare(right.slotKey),
  )
  return list
}

function syncItemViews(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<PlayerInventoryItemViewRow>,
): InventoryTradeSnapshot['items'] {
  const table = 'player_inventory_item_view'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['items'] = []

  for (const row of rows) {
    const itemInstanceId = toBigIntString(row.itemInstanceId)
    const ownerIdentityHex = identityHex(row.ownerIdentity)
    const containerId = toBigIntString(row.containerId)
    const itemDefId = toBigIntString(row.itemDefId)
    const key = `${table}:${itemInstanceId}`
    seen.add(key)
    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsInventoryView, InventoryItemViewData)
      entity.set(InventoryItemViewData, {
        itemInstanceId,
        ownerIdentityHex,
        containerId,
        slotIndex: row.slotIndex,
        itemDefId,
        quantity: row.quantity,
        durability: row.durability,
        bound: row.bound,
      })
    })

    list.push({
      itemInstanceId,
      ownerIdentityHex,
      containerId,
      slotIndex: row.slotIndex,
      itemDefId,
      quantity: row.quantity,
      durability: row.durability,
      bound: row.bound,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort(
    (left, right) =>
      compareBigIntString(left.containerId, right.containerId) ||
      left.slotIndex - right.slotIndex ||
      compareBigIntString(left.itemInstanceId, right.itemInstanceId),
  )
  return list
}

function syncWalletView(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<PlayerWalletViewRow>,
): InventoryTradeSnapshot['wallet'] {
  const table = 'player_wallet_view'
  const seen = new Set<string>()
  let wallet: InventoryTradeSnapshot['wallet'] = null

  for (const row of rows) {
    const identityHexValue = identityHex(row.identity)
    const balance = toBigIntString(row.balance)
    const updatedAt = timestampText(row.updatedAt)
    const key = `${table}:${identityHexValue}`
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsEconomyEntity, WalletData)
      entity.set(WalletData, {
        identityHex: identityHexValue,
        balance,
        updatedAt,
      })
    })

    wallet = {
      identityHex: identityHexValue,
      balance,
      updatedAt,
    }
  }

  pruneTable(ctx, knownKeys, table, seen)
  return wallet
}

function syncTradeSessions(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<TradeSessionRow>,
): InventoryTradeSnapshot['tradeSessions'] {
  const table = 'trade_session'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['tradeSessions'] = []

  for (const row of rows) {
    const key = `${table}:${row.sessionId}`
    const initiatorIdentityHex = identityHex(row.initiatorIdentity)
    const partnerIdentityHex = identityHex(row.partnerIdentity)
    const regionId = toBigIntString(row.regionId)
    const dimensionId = Number.isFinite(row.dimensionId) && row.dimensionId > 0
      ? Math.floor(row.dimensionId)
      : 1
    const updatedAt = timestampText(row.updatedAt)
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsTradeEntity, TradeSessionData)
      entity.set(TradeSessionData, {
        sessionId: row.sessionId,
        initiatorIdentityHex,
        partnerIdentityHex,
        regionId,
        dimensionId,
        phase: row.phase,
        initiatorAccepted: row.initiatorAccepted,
        partnerAccepted: row.partnerAccepted,
        updatedAt,
      })
    })

    list.push({
      sessionId: row.sessionId,
      initiatorIdentityHex,
      partnerIdentityHex,
      regionId,
      dimensionId,
      phase: row.phase,
      initiatorAccepted: row.initiatorAccepted,
      partnerAccepted: row.partnerAccepted,
      updatedAt,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => left.sessionId.localeCompare(right.sessionId))
  return list
}

function syncTradeOffers(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<TradeOfferRow>,
): InventoryTradeSnapshot['tradeOffers'] {
  const table = 'trade_offer'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['tradeOffers'] = []

  for (const row of rows) {
    const key = `${table}:${row.offerKey}`
    const ownerIdentityHex = identityHex(row.ownerIdentity)
    const itemInstanceId = toBigIntString(row.itemInstanceId)
    const updatedAt = timestampText(row.updatedAt)
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsTradeEntity, TradeOfferData)
      entity.set(TradeOfferData, {
        offerKey: row.offerKey,
        sessionId: row.sessionId,
        ownerIdentityHex,
        itemInstanceId,
        quantity: row.quantity,
        updatedAt,
      })
    })

    list.push({
      offerKey: row.offerKey,
      sessionId: row.sessionId,
      ownerIdentityHex,
      itemInstanceId,
      quantity: row.quantity,
      updatedAt,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => left.offerKey.localeCompare(right.offerKey))
  return list
}

function syncMarketOrders(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<MarketOrderRow>,
): InventoryTradeSnapshot['marketOrders'] {
  const table = 'market_order'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['marketOrders'] = []

  for (const row of rows) {
    const key = `${table}:${row.orderId}`
    const ownerIdentityHex = identityHex(row.ownerIdentity)
    const regionId = toBigIntString(row.regionId)
    const itemDefId = toBigIntString(row.itemDefId)
    const unitPrice = toBigIntString(row.unitPrice)
    const updatedAt = timestampText(row.updatedAt)
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsEconomyEntity, MarketOrderData)
      entity.set(MarketOrderData, {
        orderId: row.orderId,
        ownerIdentityHex,
        regionId,
        side: row.side,
        itemDefId,
        quantityOpen: row.quantityOpen,
        unitPrice,
        status: row.status,
        updatedAt,
      })
    })

    list.push({
      orderId: row.orderId,
      ownerIdentityHex,
      regionId,
      side: row.side,
      itemDefId,
      quantityOpen: row.quantityOpen,
      unitPrice,
      status: row.status,
      updatedAt,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => left.orderId.localeCompare(right.orderId))
  return list
}

function syncMarketFills(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<MarketFillRow>,
): InventoryTradeSnapshot['marketFills'] {
  const table = 'market_fill'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['marketFills'] = []

  for (const row of rows) {
    const key = `${table}:${row.fillId}`
    const itemDefId = toBigIntString(row.itemDefId)
    const unitPrice = toBigIntString(row.unitPrice)
    const buyerIdentityHex = identityHex(row.buyerIdentity)
    const sellerIdentityHex = identityHex(row.sellerIdentity)
    const createdAt = timestampText(row.createdAt)
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsEconomyEntity, MarketFillData)
      entity.set(MarketFillData, {
        fillId: row.fillId,
        buyOrderId: row.buyOrderId,
        sellOrderId: row.sellOrderId,
        itemDefId,
        quantity: row.quantity,
        unitPrice,
        buyerIdentityHex,
        sellerIdentityHex,
        createdAt,
      })
    })

    list.push({
      fillId: row.fillId,
      buyOrderId: row.buyOrderId,
      sellOrderId: row.sellOrderId,
      itemDefId,
      quantity: row.quantity,
      unitPrice,
      buyerIdentityHex,
      sellerIdentityHex,
      createdAt,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => left.fillId.localeCompare(right.fillId))
  return list
}

function syncPriceIndex(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<PriceIndexRow>,
): InventoryTradeSnapshot['priceIndex'] {
  const table = 'price_index'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['priceIndex'] = []

  for (const row of rows) {
    const key = `${table}:${row.indexKey}`
    const itemDefId = toBigIntString(row.itemDefId)
    const priceAvg = toBigIntString(row.priceAvg)
    const volume = toBigIntString(row.volume)
    const recordedAt = timestampText(row.recordedAt)
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsEconomyEntity, PriceIndexData)
      entity.set(PriceIndexData, {
        indexKey: row.indexKey,
        itemDefId,
        priceAvg,
        volume,
        recordedAt,
      })
    })

    list.push({
      indexKey: row.indexKey,
      itemDefId,
      priceAvg,
      volume,
      recordedAt,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => compareBigIntString(left.itemDefId, right.itemDefId))
  return list
}

function syncItemDefs(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<ItemDefRow>,
): InventoryTradeSnapshot['itemDefs'] {
  const table = 'item_def'
  const seen = new Set<string>()
  const list: InventoryTradeSnapshot['itemDefs'] = []

  for (const row of rows) {
    const itemDefId = toBigIntString(row.itemDefId)
    const key = `${table}:${itemDefId}`
    seen.add(key)

    upsertDomainEntity(ctx, key, (entity) => {
      entity.add(IsEconomyEntity, ItemDefData)
      entity.set(ItemDefData, {
        itemDefId,
        category: row.category,
        rarity: row.rarity,
        maxStack: row.maxStack,
        volume: row.volume,
      })
    })

    list.push({
      itemDefId,
      category: row.category,
      rarity: row.rarity,
      maxStack: row.maxStack,
      volume: row.volume,
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  list.sort((left, right) => compareBigIntString(left.itemDefId, right.itemDefId))
  return list
}

function collectTradePartners(
  localIdentityHex: string,
  tradeSessions: InventoryTradeSnapshot['tradeSessions'],
  sessions: Iterable<PlayerSessionViewRow>,
  transforms: Iterable<TransformStateRow>,
): InventoryTradeSnapshot['tradePartners'] {
  const candidates = new Set<string>()
  for (const session of tradeSessions) {
    if (session.initiatorIdentityHex !== localIdentityHex) {
      candidates.add(session.initiatorIdentityHex)
    }
    if (session.partnerIdentityHex !== localIdentityHex) {
      candidates.add(session.partnerIdentityHex)
    }
  }
  for (const row of sessions) {
    const candidate = identityHex(row.identity)
    if (candidate !== localIdentityHex) {
      candidates.add(candidate)
    }
  }
  for (const row of transforms) {
    const candidate = identityHex(row.entityId)
    if (candidate !== localIdentityHex) {
      candidates.add(candidate)
    }
  }

  return [...candidates]
    .sort()
    .map((identityHexValue) => ({
      identityHex: identityHexValue,
    }))
}

function upsertDomainEntity(
  ctx: RuntimeContext,
  key: string,
  apply: (entity: ReturnType<RuntimeContext['world']['upsertByNetKey']>) => void,
): void {
  ctx.world.upsertByNetKey(key, (entity) => apply(entity))
}

function pruneTable(ctx: RuntimeContext, knownKeys: Map<string, Set<string>>, table: string, seen: Set<string>): void {
  const tableKnown = knownKeys.get(table) ?? new Set<string>()

  for (const key of tableKnown) {
    if (seen.has(key)) {
      continue
    }
    ctx.world.despawnByNetKey(key)
    tableKnown.delete(key)
  }

  for (const key of seen) {
    tableKnown.add(key)
  }

  knownKeys.set(table, tableKnown)
}

function clearDomainEntities(ctx: RuntimeContext, knownKeys: Map<string, Set<string>>): void {
  for (const keys of knownKeys.values()) {
    for (const key of keys) {
      ctx.world.despawnByNetKey(key)
    }
  }
  knownKeys.clear()
}

function parseIdentity(value: string): Identity | Error {
  const normalized = normalizeIdentityHex(value)
  if (!normalized || normalized.length !== 64) {
    return new Error('partnerIdentityHex must be a 64-char hex string')
  }
  return new Identity(normalized)
}

function parseU64(value: string, fieldName: string): bigint | Error {
  try {
    const parsed = BigInt(value)
    if (parsed < 0n) {
      return new Error(`${fieldName} must be non-negative`)
    }
    return parsed
  } catch {
    return new Error(`${fieldName} must be a valid integer`)
  }
}

function toU32(value: number): number {
  return Math.max(0, Math.floor(value))
}

function toBigIntString(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString()
  }
  return String(value)
}

function compareBigIntString(left: string, right: string): number {
  try {
    const leftBig = BigInt(left)
    const rightBig = BigInt(right)
    if (leftBig === rightBig) {
      return 0
    }
    return leftBig > rightBig ? 1 : -1
  } catch {
    return left.localeCompare(right)
  }
}

function timestampText(value: unknown): string {
  return String(value)
}

function identityHex(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return normalizeIdentityHex(candidate.toHexString()) ?? ''
  }
  return normalizeIdentityHex(String(value)) ?? ''
}

function normalizeIdentityHex(value: string | null): string | null {
  if (!value) {
    return null
  }
  const normalized = value.trim().toLowerCase().replace(/^0x/, '')
  return normalized.length > 0 ? normalized : null
}

function toIdentityLiteral(identityHex: string): string {
  return `0x${identityHex}`
}

function failResult(error: string): InventoryTradeActionResult {
  return { ok: false, error }
}
