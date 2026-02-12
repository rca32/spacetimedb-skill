import type {
  BuildClaimHousingActionResult,
  BuildClaimHousingActions,
  BuildClaimHousingSnapshot,
  InventoryTradeActionResult,
  InventoryTradeActions,
  InventoryTradeSnapshot,
  TradeSessionSnapshot,
} from '../../runtime/types'

type PanelTab = 'inventory' | 'trade' | 'market' | 'build' | 'claim' | 'housing'

interface SelectOption {
  value: string
  label: string
}

interface PendingAction {
  label: string
  startedAtMs: number
  digestBefore: string
}

interface ReducerFailure {
  message: string
  atMs: number
}

interface ActionResultLike {
  ok: boolean
  error?: string
}

const PENDING_TIMEOUT_MS = 1_500
const ENABLE_MARKET_MATCH_TEST_ONLY =
  (import.meta.env.VITE_ENABLE_MARKET_MATCH_TEST ?? '0') === '1' || import.meta.env.DEV

export class PanelLayer {
  private readonly root: HTMLDivElement
  private readonly summaryLine: HTMLDivElement
  private readonly modeLine: HTMLDivElement
  private readonly toastLine: HTMLDivElement
  private readonly toolbar: HTMLDivElement
  private readonly body: HTMLDivElement

  private readonly inventoryTabButton: HTMLButtonElement
  private readonly tradeTabButton: HTMLButtonElement
  private readonly marketTabButton: HTMLButtonElement
  private readonly buildTabButton: HTMLButtonElement
  private readonly claimTabButton: HTMLButtonElement
  private readonly housingTabButton: HTMLButtonElement

  private readonly inventorySection: HTMLDivElement
  private readonly tradeSection: HTMLDivElement
  private readonly marketSection: HTMLDivElement
  private readonly buildSection: HTMLDivElement
  private readonly claimSection: HTMLDivElement
  private readonly housingSection: HTMLDivElement

  private readonly inventoryBootstrapButton: HTMLButtonElement
  private readonly inventoryFromSelect: HTMLSelectElement
  private readonly inventoryToSelect: HTMLSelectElement
  private readonly inventoryQuantityInput: HTMLInputElement
  private readonly inventoryMoveButton: HTMLButtonElement

  private readonly tradePartnerSelect: HTMLSelectElement
  private readonly tradePartnerManualInput: HTMLInputElement
  private readonly tradeSessionIdInput: HTMLInputElement
  private readonly tradeOpenSessionButton: HTMLButtonElement
  private readonly tradeSessionSelect: HTMLSelectElement
  private readonly tradeItemSelect: HTMLSelectElement
  private readonly tradeQuantityInput: HTMLInputElement
  private readonly tradeAddItemButton: HTMLButtonElement
  private readonly tradeAcceptedCheckbox: HTMLInputElement
  private readonly tradeAcceptButton: HTMLButtonElement

  private readonly marketOrderIdInput: HTMLInputElement
  private readonly marketSideSelect: HTMLSelectElement
  private readonly marketItemDefSelect: HTMLSelectElement
  private readonly marketQuantityInput: HTMLInputElement
  private readonly marketUnitPriceInput: HTMLInputElement
  private readonly marketPlaceButton: HTMLButtonElement
  private readonly marketCancelOrderSelect: HTMLSelectElement
  private readonly marketCancelButton: HTMLButtonElement

  private readonly marketMatchContainer: HTMLDivElement
  private readonly marketMatchBuySelect: HTMLSelectElement
  private readonly marketMatchSellSelect: HTMLSelectElement
  private readonly marketMatchQuantityInput: HTMLInputElement
  private readonly marketMatchButton: HTMLButtonElement

  private readonly buildRegionInput: HTMLInputElement
  private readonly buildHexXInput: HTMLInputElement
  private readonly buildHexZInput: HTMLInputElement
  private readonly buildDefSelect: HTMLSelectElement
  private readonly buildIdInput: HTMLInputElement
  private readonly buildPlaceButton: HTMLButtonElement
  private readonly buildAdvanceTargetSelect: HTMLSelectElement
  private readonly buildAdvanceStepsInput: HTMLInputElement
  private readonly buildAdvanceButton: HTMLButtonElement
  private readonly buildDeconstructTargetSelect: HTMLSelectElement
  private readonly buildDeconstructButton: HTMLButtonElement

  private readonly claimTotemBuildingSelect: HTMLSelectElement
  private readonly claimIdInput: HTMLInputElement
  private readonly claimRadiusInput: HTMLInputElement
  private readonly claimPlaceButton: HTMLButtonElement
  private readonly claimTargetSelect: HTMLSelectElement
  private readonly claimRadiusDeltaInput: HTMLInputElement
  private readonly claimExpandButton: HTMLButtonElement

  private readonly housingEntranceBuildingSelect: HTMLSelectElement
  private readonly housingEntityIdInput: HTMLInputElement
  private readonly housingNetworkIdInput: HTMLInputElement
  private readonly housingDimensionEntityIdInput: HTMLInputElement
  private readonly housingDimensionIdInput: HTMLInputElement
  private readonly housingInteriorInstanceIdInput: HTMLInputElement
  private readonly housingCreateButton: HTMLButtonElement
  private readonly housingSelect: HTMLSelectElement
  private readonly housingPortalXInput: HTMLInputElement
  private readonly housingPortalYInput: HTMLInputElement
  private readonly housingPortalZInput: HTMLInputElement
  private readonly housingEnterButton: HTMLButtonElement
  private readonly housingNewEntranceSelect: HTMLSelectElement
  private readonly housingTargetRegionInput: HTMLInputElement
  private readonly housingMovingMinutesInput: HTMLInputElement
  private readonly housingChangeEntranceButton: HTMLButtonElement
  private readonly housingIsEmptyCheckbox: HTMLInputElement
  private readonly housingRespawnDelayInput: HTMLInputElement
  private readonly housingMarkEmptyButton: HTMLButtonElement
  private readonly housingSubjectIdentityInput: HTMLInputElement
  private readonly housingGrantUseCheckbox: HTMLInputElement
  private readonly housingGrantBuildCheckbox: HTMLInputElement
  private readonly housingGrantAdminCheckbox: HTMLInputElement
  private readonly housingPropagateButton: HTMLButtonElement
  private readonly housingWhitelistInput: HTMLInputElement
  private readonly housingSetWhitelistButton: HTMLButtonElement

  private inventoryTradeActions: InventoryTradeActions | null = null
  private buildClaimHousingActions: BuildClaimHousingActions | null = null
  private reducerFailureLookup: ((name: string) => ReducerFailure | null) | null = null
  private reducerFailureClear: ((name: string) => void) | null = null
  private currentInventorySnapshot: InventoryTradeSnapshot | null = null
  private currentBuildClaimHousingSnapshot: BuildClaimHousingSnapshot | null = null
  private currentTab: PanelTab | null = null
  private readOnly = true
  private pending: PendingAction | null = null
  private inventoryDigest = ''
  private buildClaimHousingDigest = ''
  private latestDigest = ''
  private tradeAcceptDraft: boolean | null = null

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.right = '12px'
    this.root.style.bottom = '12px'
    this.root.style.width = '390px'
    this.root.style.maxHeight = '60vh'
    this.root.style.padding = '10px 12px'
    this.root.style.background = 'rgba(8, 14, 24, 0.82)'
    this.root.style.border = '1px solid rgba(126, 169, 216, 0.45)'
    this.root.style.borderRadius = '12px'
    this.root.style.backdropFilter = 'blur(2px)'
    this.root.style.pointerEvents = 'auto'
    this.root.style.display = 'flex'
    this.root.style.flexDirection = 'column'
    this.root.style.gap = '8px'

    this.summaryLine = document.createElement('div')
    this.summaryLine.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
    this.summaryLine.style.color = '#dce9fb'
    this.summaryLine.style.fontSize = '12px'

    this.modeLine = document.createElement('div')
    this.modeLine.style.fontFamily = 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    this.modeLine.style.color = '#89b9ff'
    this.modeLine.style.fontSize = '11px'

    this.toastLine = document.createElement('div')
    this.toastLine.style.minHeight = '16px'
    this.toastLine.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
    this.toastLine.style.fontSize = '11px'
    this.toastLine.style.color = '#f4bf68'

    this.toolbar = document.createElement('div')
    this.toolbar.style.display = 'grid'
    this.toolbar.style.gridTemplateColumns = 'repeat(3, 1fr)'
    this.toolbar.style.gap = '6px'

    this.inventoryTabButton = this.createTabButton('I Inventory')
    this.tradeTabButton = this.createTabButton('T Trade')
    this.marketTabButton = this.createTabButton('M Market')
    this.buildTabButton = this.createTabButton('B Build')
    this.claimTabButton = this.createTabButton('C Claim')
    this.housingTabButton = this.createTabButton('H Housing')
    this.toolbar.append(
      this.inventoryTabButton,
      this.tradeTabButton,
      this.marketTabButton,
      this.buildTabButton,
      this.claimTabButton,
      this.housingTabButton,
    )

    this.body = document.createElement('div')
    this.body.style.display = 'none'
    this.body.style.flexDirection = 'column'
    this.body.style.gap = '10px'
    this.body.style.maxHeight = '46vh'
    this.body.style.overflow = 'auto'
    this.body.style.padding = '8px'
    this.body.style.border = '1px solid rgba(137, 185, 255, 0.35)'
    this.body.style.borderRadius = '10px'
    this.body.style.background = 'rgba(9, 15, 26, 0.82)'

    const inventoryUi = this.createInventorySection()
    this.inventorySection = inventoryUi.section
    this.inventoryBootstrapButton = inventoryUi.bootstrapButton
    this.inventoryFromSelect = inventoryUi.fromSelect
    this.inventoryToSelect = inventoryUi.toSelect
    this.inventoryQuantityInput = inventoryUi.quantityInput
    this.inventoryMoveButton = inventoryUi.moveButton

    const tradeUi = this.createTradeSection()
    this.tradeSection = tradeUi.section
    this.tradePartnerSelect = tradeUi.partnerSelect
    this.tradePartnerManualInput = tradeUi.partnerManualInput
    this.tradeSessionIdInput = tradeUi.sessionIdInput
    this.tradeOpenSessionButton = tradeUi.openSessionButton
    this.tradeSessionSelect = tradeUi.sessionSelect
    this.tradeItemSelect = tradeUi.itemSelect
    this.tradeQuantityInput = tradeUi.quantityInput
    this.tradeAddItemButton = tradeUi.addItemButton
    this.tradeAcceptedCheckbox = tradeUi.acceptedCheckbox
    this.tradeAcceptButton = tradeUi.acceptButton

    const marketUi = this.createMarketSection()
    this.marketSection = marketUi.section
    this.marketOrderIdInput = marketUi.orderIdInput
    this.marketSideSelect = marketUi.sideSelect
    this.marketItemDefSelect = marketUi.itemDefSelect
    this.marketQuantityInput = marketUi.quantityInput
    this.marketUnitPriceInput = marketUi.unitPriceInput
    this.marketPlaceButton = marketUi.placeButton
    this.marketCancelOrderSelect = marketUi.cancelOrderSelect
    this.marketCancelButton = marketUi.cancelButton
    this.marketMatchContainer = marketUi.matchContainer
    this.marketMatchBuySelect = marketUi.matchBuySelect
    this.marketMatchSellSelect = marketUi.matchSellSelect
    this.marketMatchQuantityInput = marketUi.matchQuantityInput
    this.marketMatchButton = marketUi.matchButton

    const buildUi = this.createBuildSection()
    this.buildSection = buildUi.section
    this.buildRegionInput = buildUi.regionInput
    this.buildHexXInput = buildUi.hexXInput
    this.buildHexZInput = buildUi.hexZInput
    this.buildDefSelect = buildUi.defSelect
    this.buildIdInput = buildUi.buildingIdInput
    this.buildPlaceButton = buildUi.placeButton
    this.buildAdvanceTargetSelect = buildUi.advanceTargetSelect
    this.buildAdvanceStepsInput = buildUi.advanceStepsInput
    this.buildAdvanceButton = buildUi.advanceButton
    this.buildDeconstructTargetSelect = buildUi.deconstructTargetSelect
    this.buildDeconstructButton = buildUi.deconstructButton

    const claimUi = this.createClaimSection()
    this.claimSection = claimUi.section
    this.claimTotemBuildingSelect = claimUi.totemBuildingSelect
    this.claimIdInput = claimUi.claimIdInput
    this.claimRadiusInput = claimUi.radiusInput
    this.claimPlaceButton = claimUi.placeButton
    this.claimTargetSelect = claimUi.claimTargetSelect
    this.claimRadiusDeltaInput = claimUi.radiusDeltaInput
    this.claimExpandButton = claimUi.expandButton

    const housingUi = this.createHousingSection()
    this.housingSection = housingUi.section
    this.housingEntranceBuildingSelect = housingUi.entranceBuildingSelect
    this.housingEntityIdInput = housingUi.housingEntityIdInput
    this.housingNetworkIdInput = housingUi.networkEntityIdInput
    this.housingDimensionEntityIdInput = housingUi.dimensionEntityIdInput
    this.housingDimensionIdInput = housingUi.dimensionIdInput
    this.housingInteriorInstanceIdInput = housingUi.interiorInstanceIdInput
    this.housingCreateButton = housingUi.createHousingButton
    this.housingSelect = housingUi.housingSelect
    this.housingPortalXInput = housingUi.portalXInput
    this.housingPortalYInput = housingUi.portalYInput
    this.housingPortalZInput = housingUi.portalZInput
    this.housingEnterButton = housingUi.enterButton
    this.housingNewEntranceSelect = housingUi.newEntranceSelect
    this.housingTargetRegionInput = housingUi.targetRegionInput
    this.housingMovingMinutesInput = housingUi.movingMinutesInput
    this.housingChangeEntranceButton = housingUi.changeEntranceButton
    this.housingIsEmptyCheckbox = housingUi.isEmptyCheckbox
    this.housingRespawnDelayInput = housingUi.respawnDelayInput
    this.housingMarkEmptyButton = housingUi.markEmptyButton
    this.housingSubjectIdentityInput = housingUi.subjectIdentityInput
    this.housingGrantUseCheckbox = housingUi.grantUseCheckbox
    this.housingGrantBuildCheckbox = housingUi.grantBuildCheckbox
    this.housingGrantAdminCheckbox = housingUi.grantAdminCheckbox
    this.housingPropagateButton = housingUi.propagateButton
    this.housingWhitelistInput = housingUi.whitelistInput
    this.housingSetWhitelistButton = housingUi.setWhitelistButton

    this.body.append(
      this.inventorySection,
      this.tradeSection,
      this.marketSection,
      this.buildSection,
      this.claimSection,
      this.housingSection,
    )
    this.root.append(this.summaryLine, this.modeLine, this.toastLine, this.toolbar, this.body)
    container.appendChild(this.root)

    this.bindEvents()
    this.setText('inactive')
    this.setReadOnly(true)
  }

  bindInventoryTrade(actions: InventoryTradeActions): void {
    this.inventoryTradeActions = actions
  }

  bindBuildClaimHousing(actions: BuildClaimHousingActions): void {
    this.buildClaimHousingActions = actions
  }

  bindReducerFailureAccess(
    getFailure: (name: string) => ReducerFailure | null,
    clearFailure: (name: string) => void,
  ): void {
    this.reducerFailureLookup = getFailure
    this.reducerFailureClear = clearFailure
  }

  renderInventoryTrade(snapshot: InventoryTradeSnapshot): void {
    this.currentInventorySnapshot = snapshot
    this.inventoryDigest = computeInventoryDigest(snapshot)
    this.syncCombinedDigest()
    this.refreshInventoryUi(snapshot)
    this.refreshTradeUi(snapshot)
    this.refreshMarketUi(snapshot)
    this.updatePendingStatus()
    this.updateVisibility()
  }

  renderBuildClaimHousing(snapshot: BuildClaimHousingSnapshot): void {
    this.currentBuildClaimHousingSnapshot = snapshot
    this.buildClaimHousingDigest = computeBuildClaimHousingDigest(snapshot)
    this.syncCombinedDigest()
    this.refreshBuildClaimHousingUi(snapshot)
    this.updatePendingStatus()
    this.updateVisibility()
  }

  handleShortcut(code: string): boolean {
    if (code === 'KeyI') {
      this.toggleTab('inventory')
      return true
    }
    if (code === 'KeyT') {
      this.toggleTab('trade')
      return true
    }
    if (code === 'KeyM') {
      this.toggleTab('market')
      return true
    }
    if (code === 'KeyB') {
      this.toggleTab('build')
      return true
    }
    if (code === 'KeyC') {
      this.toggleTab('claim')
      return true
    }
    if (code === 'KeyH') {
      this.toggleTab('housing')
      return true
    }
    return false
  }

  setText(text: string): void {
    this.summaryLine.textContent = `Panels: ${text}`
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly
    this.modeLine.textContent = readOnly ? 'MODE: READ-ONLY' : 'MODE: INTERACTIVE'
    this.modeLine.style.color = readOnly ? '#f4bf68' : '#89d6a4'
    this.applyDisabledState()
  }

  destroy(): void {
    this.root.remove()
  }

  private bindEvents(): void {
    this.inventoryTabButton.addEventListener('click', () => this.toggleTab('inventory'))
    this.tradeTabButton.addEventListener('click', () => this.toggleTab('trade'))
    this.marketTabButton.addEventListener('click', () => this.toggleTab('market'))
    this.buildTabButton.addEventListener('click', () => this.toggleTab('build'))
    this.claimTabButton.addEventListener('click', () => this.toggleTab('claim'))
    this.housingTabButton.addEventListener('click', () => this.toggleTab('housing'))

    this.inventoryBootstrapButton.addEventListener('click', () => {
      this.dispatchAction('inventory_bootstrap', () => this.inventoryTradeActions?.bootstrapInventory())
    })

    this.inventoryMoveButton.addEventListener('click', () => {
      if (!this.currentInventorySnapshot) {
        return
      }
      const fromSlot = this.currentInventorySnapshot.slots.find((slot) => slot.slotKey === this.inventoryFromSelect.value)
      const toSlot = this.currentInventorySnapshot.slots.find((slot) => slot.slotKey === this.inventoryToSelect.value)
      const quantity = Number.parseInt(this.inventoryQuantityInput.value, 10)
      if (!fromSlot || !toSlot) {
        this.setToast('slot selection is required')
        return
      }
      this.dispatchAction('item_stack_move', () =>
        this.inventoryTradeActions?.moveItemStack({
          containerId: fromSlot.containerId,
          fromSlotIndex: fromSlot.slotIndex,
          toSlotIndex: toSlot.slotIndex,
          quantity: Number.isFinite(quantity) ? quantity : 0,
        }),
      )
    })

    this.tradeOpenSessionButton.addEventListener('click', () => {
      const manual = this.tradePartnerManualInput.value.trim()
      const partnerIdentityHex = manual || this.tradePartnerSelect.value
      if (!partnerIdentityHex) {
        this.setToast('trade partner is required')
        return
      }
      this.dispatchAction('trade_session_open', () =>
        this.inventoryTradeActions?.openTradeSession({
          partnerIdentityHex,
          sessionId: this.tradeSessionIdInput.value.trim() || undefined,
        }),
      )
    })

    this.tradeAddItemButton.addEventListener('click', () => {
      const sessionId = this.tradeSessionSelect.value
      const itemInstanceId = this.tradeItemSelect.value
      const quantity = Number.parseInt(this.tradeQuantityInput.value, 10)
      if (!sessionId || !itemInstanceId) {
        this.setToast('session and item selection are required')
        return
      }
      this.dispatchAction('trade_item_add', () =>
        this.inventoryTradeActions?.addTradeItem({
          sessionId,
          itemInstanceId,
          quantity: Number.isFinite(quantity) ? quantity : 0,
        }),
      )
    })

    this.tradeAcceptButton.addEventListener('click', () => {
      const sessionId = this.tradeSessionSelect.value
      if (!sessionId) {
        this.setToast('select a trade session first')
        return
      }
      this.dispatchAction('trade_accept', () =>
        this.inventoryTradeActions?.setTradeAccept({
          sessionId,
          accepted: this.tradeAcceptedCheckbox.checked,
        }),
      )
      this.tradeAcceptDraft = null
    })

    this.marketPlaceButton.addEventListener('click', () => {
      const side = Number.parseInt(this.marketSideSelect.value, 10)
      const quantity = Number.parseInt(this.marketQuantityInput.value, 10)
      const itemDefId = this.marketItemDefSelect.value
      const unitPrice = this.marketUnitPriceInput.value.trim()
      this.dispatchAction('market_order_place', () =>
        this.inventoryTradeActions?.placeMarketOrder({
          orderId: this.marketOrderIdInput.value.trim() || undefined,
          side: Number.isFinite(side) ? side : -1,
          itemDefId,
          quantity: Number.isFinite(quantity) ? quantity : 0,
          unitPrice,
        }),
      )
    })

    this.marketCancelButton.addEventListener('click', () => {
      const orderId = this.marketCancelOrderSelect.value
      if (!orderId) {
        this.setToast('select an order to cancel')
        return
      }
      this.dispatchAction('market_order_cancel', () => this.inventoryTradeActions?.cancelMarketOrder({ orderId }))
    })

    this.marketMatchButton.addEventListener('click', () => {
      const buyOrderId = this.marketMatchBuySelect.value
      const sellOrderId = this.marketMatchSellSelect.value
      const quantity = Number.parseInt(this.marketMatchQuantityInput.value, 10)
      if (!buyOrderId || !sellOrderId) {
        this.setToast('buy/sell orders are required')
        return
      }
      if (this.currentInventorySnapshot) {
        const buyOrder = this.currentInventorySnapshot.marketOrders.find((order) => order.orderId === buyOrderId)
        if (buyOrder && this.currentInventorySnapshot.wallet === null) {
          this.setToast('wallet not initialized; buyer wallet funding is required for market match')
          return
        }
      }
      this.dispatchAction('market_order_match', () =>
        this.inventoryTradeActions?.matchMarketOrderTestOnly({
          buyOrderId,
          sellOrderId,
          quantity: Number.isFinite(quantity) ? quantity : 0,
        }),
      )
    })

    this.buildPlaceButton.addEventListener('click', () => {
      const regionId = Number.parseInt(this.buildRegionInput.value, 10)
      const hexX = Number.parseInt(this.buildHexXInput.value, 10)
      const hexZ = Number.parseInt(this.buildHexZInput.value, 10)
      const buildingDefId = this.buildDefSelect.value
      if (!buildingDefId) {
        this.setToast('building def is required')
        return
      }
      this.dispatchAction('building_place', () =>
        this.buildClaimHousingActions?.placeBuilding({
          regionId: Number.isFinite(regionId) ? regionId : 0,
          hexX: Number.isFinite(hexX) ? hexX : 0,
          hexZ: Number.isFinite(hexZ) ? hexZ : 0,
          buildingDefId,
          buildingId: this.buildIdInput.value.trim() || undefined,
        }),
      )
    })

    this.buildAdvanceButton.addEventListener('click', () => {
      const buildingId = this.buildAdvanceTargetSelect.value
      const steps = Number.parseInt(this.buildAdvanceStepsInput.value, 10)
      if (!buildingId) {
        this.setToast('select building to advance')
        return
      }
      this.dispatchAction('building_advance', () =>
        this.buildClaimHousingActions?.advanceBuilding({
          buildingId,
          steps: Number.isFinite(steps) ? steps : 0,
        }),
      )
    })

    this.buildDeconstructButton.addEventListener('click', () => {
      const buildingId = this.buildDeconstructTargetSelect.value
      if (!buildingId) {
        this.setToast('select building to deconstruct')
        return
      }
      this.dispatchAction('building_deconstruct', () =>
        this.buildClaimHousingActions?.deconstructBuilding({ buildingId }),
      )
    })

    this.claimPlaceButton.addEventListener('click', () => {
      const totemBuildingId = this.claimTotemBuildingSelect.value
      const radius = Number.parseInt(this.claimRadiusInput.value, 10)
      if (!totemBuildingId) {
        this.setToast('select complete totem building')
        return
      }
      this.dispatchAction('claim_totem_place', () =>
        this.buildClaimHousingActions?.placeClaimTotem({
          totemBuildingId,
          radius: Number.isFinite(radius) ? radius : 0,
          claimId: this.claimIdInput.value.trim() || undefined,
        }),
      )
    })

    this.claimExpandButton.addEventListener('click', () => {
      const claimId = this.claimTargetSelect.value
      const radiusDelta = Number.parseInt(this.claimRadiusDeltaInput.value, 10)
      if (!claimId) {
        this.setToast('select claim to expand')
        return
      }
      this.dispatchAction('claim_expand', () =>
        this.buildClaimHousingActions?.expandClaim({
          claimId,
          radiusDelta: Number.isFinite(radiusDelta) ? radiusDelta : 0,
        }),
      )
    })

    this.housingCreateButton.addEventListener('click', () => {
      const entranceBuildingEntityId = this.housingEntranceBuildingSelect.value
      const dimensionId = Number.parseInt(this.housingDimensionIdInput.value, 10)
      const interiorInstanceId = this.housingInteriorInstanceIdInput.value.trim()
      if (!entranceBuildingEntityId) {
        this.setToast('select entrance building')
        return
      }
      if (!interiorInstanceId) {
        this.setToast('interior instance id is required')
        return
      }
      this.dispatchAction('housing_create', () =>
        this.buildClaimHousingActions?.createHousing({
          entranceBuildingEntityId,
          dimensionId: Number.isFinite(dimensionId) ? dimensionId : 0,
          interiorInstanceId,
          housingEntityId: this.housingEntityIdInput.value.trim() || undefined,
          networkEntityId: this.housingNetworkIdInput.value.trim() || undefined,
          dimensionEntityId: this.housingDimensionEntityIdInput.value.trim() || undefined,
        }),
      )
    })

    this.housingEnterButton.addEventListener('click', () => {
      const housingEntityId = this.resolveHousingTargetId()
      const portalX = Number.parseFloat(this.housingPortalXInput.value)
      const portalY = Number.parseFloat(this.housingPortalYInput.value)
      const portalZ = Number.parseFloat(this.housingPortalZInput.value)
      if (!housingEntityId) {
        this.setToast('select housing first')
        return
      }
      this.dispatchAction('housing_enter', () =>
        this.buildClaimHousingActions?.enterHousing({
          housingEntityId,
          portalX: Number.isFinite(portalX) ? portalX : 0,
          portalY: Number.isFinite(portalY) ? portalY : 0,
          portalZ: Number.isFinite(portalZ) ? portalZ : 0,
        }),
      )
    })

    this.housingChangeEntranceButton.addEventListener('click', () => {
      const housingEntityId = this.resolveHousingTargetId()
      const newEntranceBuildingEntityId = this.housingNewEntranceSelect.value
      const targetRegionIndex = Number.parseInt(this.housingTargetRegionInput.value, 10)
      const movingMinutes = Number.parseInt(this.housingMovingMinutesInput.value, 10)
      if (!housingEntityId || !newEntranceBuildingEntityId) {
        this.setToast('housing and new entrance are required')
        return
      }
      this.dispatchAction('housing_change_entrance', () =>
        this.buildClaimHousingActions?.changeHousingEntrance({
          housingEntityId,
          newEntranceBuildingEntityId,
          targetRegionIndex: Number.isFinite(targetRegionIndex) ? targetRegionIndex : 0,
          movingMinutes: Number.isFinite(movingMinutes) ? movingMinutes : 0,
        }),
      )
    })

    this.housingMarkEmptyButton.addEventListener('click', () => {
      const housingEntityId = this.resolveHousingTargetId()
      const respawnDelaySeconds = Number.parseInt(this.housingRespawnDelayInput.value, 10)
      if (!housingEntityId) {
        this.setToast('select housing first')
        return
      }
      this.dispatchAction('interior_mark_empty', () =>
        this.buildClaimHousingActions?.markInteriorEmpty({
          housingEntityId,
          isEmpty: this.housingIsEmptyCheckbox.checked,
          respawnDelaySeconds: Number.isFinite(respawnDelaySeconds) ? respawnDelaySeconds : 0,
        }),
      )
    })

    this.housingPropagateButton.addEventListener('click', () => {
      const housingEntityId = this.resolveHousingTargetId()
      const subjectIdentityHex = this.housingSubjectIdentityInput.value.trim()
      if (!housingEntityId || !subjectIdentityHex) {
        this.setToast('housing and subject identity are required')
        return
      }
      this.dispatchAction('housing_propagate_permissions', () =>
        this.buildClaimHousingActions?.propagateHousingPermissions({
          housingEntityId,
          subjectIdentityHex,
          grantUse: this.housingGrantUseCheckbox.checked,
          grantBuild: this.housingGrantBuildCheckbox.checked,
          grantAdmin: this.housingGrantAdminCheckbox.checked,
        }),
      )
    })

    this.housingSetWhitelistButton.addEventListener('click', () => {
      const housingEntityId = this.resolveHousingTargetId()
      if (!housingEntityId) {
        this.setToast('select housing first')
        return
      }
      const whiteListIdentityHexes = this.housingWhitelistInput.value
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)

      this.dispatchAction('rent_set_whitelist', () =>
        this.buildClaimHousingActions?.setRentWhitelist({
          housingEntityId,
          whiteListIdentityHexes,
        }),
      )
    })
  }

  private dispatchAction(name: string, dispatch: () => ActionResultLike | undefined): void {
    if (this.readOnly) {
      this.setToast('panel is read-only during reconnect/auth')
      return
    }
    const result = dispatch()
    if (!result || !result.ok) {
      this.setToast(result?.error ?? `failed to dispatch ${name}`)
      return
    }
    this.pending = {
      label: name,
      startedAtMs: Date.now(),
      digestBefore: this.latestDigest,
    }
    this.reducerFailureClear?.(name)
    this.setToast(`${name} dispatched`)
  }

  private refreshInventoryUi(snapshot: InventoryTradeSnapshot): void {
    const slotOptions: SelectOption[] = snapshot.slots.map((slot) => {
      const item = snapshot.items.find((candidate) => candidate.itemInstanceId === slot.itemInstanceId)
      const qty = item?.quantity ?? 0
      return {
        value: slot.slotKey,
        label: `C${slot.containerId} S${slot.slotIndex} qty=${qty}${slot.locked ? ' [L]' : ''}`,
      }
    })
    syncSelect(this.inventoryFromSelect, slotOptions)
    syncSelect(this.inventoryToSelect, slotOptions)
  }

  private refreshTradeUi(snapshot: InventoryTradeSnapshot): void {
    const partnerOptions = snapshot.tradePartners.map((partner) => ({
      value: partner.identityHex,
      label: partner.identityHex,
    }))
    syncSelect(this.tradePartnerSelect, partnerOptions)

    const sessionOptions = snapshot.tradeSessions.map((session) => ({
      value: session.sessionId,
      label: `${session.sessionId} phase=${session.phase}`,
    }))
    syncSelect(this.tradeSessionSelect, sessionOptions)

    const itemOptions = snapshot.items.map((item) => ({
      value: item.itemInstanceId,
      label: `inst=${item.itemInstanceId} def=${item.itemDefId} qty=${item.quantity}`,
    }))
    syncSelect(this.tradeItemSelect, itemOptions)

    const selectedSession = snapshot.tradeSessions.find((session) => session.sessionId === this.tradeSessionSelect.value)
    if (this.tradeAcceptDraft === null) {
      this.tradeAcceptedCheckbox.checked = deriveAcceptedByLocalIdentity(snapshot.identityHex, selectedSession)
    }
  }

  private refreshMarketUi(snapshot: InventoryTradeSnapshot): void {
    const itemOptions = snapshot.itemDefs.map((itemDef) => ({
      value: itemDef.itemDefId,
      label: `def=${itemDef.itemDefId} stack=${itemDef.maxStack} vol=${itemDef.volume}`,
    }))
    syncSelect(this.marketItemDefSelect, itemOptions)

    const cancelOptions = snapshot.marketOrders
      .filter(
        (order) => order.status === 0 && (!snapshot.identityHex || order.ownerIdentityHex === snapshot.identityHex),
      )
      .map((order) => ({
        value: order.orderId,
        label: `${order.orderId} side=${order.side} qty=${order.quantityOpen}`,
      }))
    syncSelect(this.marketCancelOrderSelect, cancelOptions)

    const buyOptions = snapshot.marketOrders
      .filter((order) => order.status === 0 && order.side === 0)
      .map((order) => ({
        value: order.orderId,
        label: `${order.orderId} q=${order.quantityOpen} p=${order.unitPrice}`,
      }))
    const sellOptions = snapshot.marketOrders
      .filter((order) => order.status === 0 && order.side === 1)
      .map((order) => ({
        value: order.orderId,
        label: `${order.orderId} q=${order.quantityOpen} p=${order.unitPrice}`,
      }))
    syncSelect(this.marketMatchBuySelect, buyOptions)
    syncSelect(this.marketMatchSellSelect, sellOptions)
  }

  private refreshBuildClaimHousingUi(snapshot: BuildClaimHousingSnapshot): void {
    const buildDefOptions = snapshot.buildingDefs.map((row) => ({
      value: row.buildingDefId,
      label: `def=${row.buildingDefId} req=${row.requiredItemDefId}x${row.requiredItemQty} build=${row.buildRequired}`,
    }))
    syncSelect(this.buildDefSelect, buildDefOptions)

    const buildingOptions = snapshot.buildings.map((row) => ({
      value: row.entityId,
      label: `id=${row.entityId} st=${row.state} p=${row.buildProgress}/${row.buildRequired} r=${row.regionId}`,
    }))
    syncSelect(this.buildAdvanceTargetSelect, buildingOptions)
    syncSelect(this.buildDeconstructTargetSelect, buildingOptions)

    const completeBuildingOptions = snapshot.buildings
      .filter((row) => row.state === 1)
      .map((row) => ({
        value: row.entityId,
        label: `id=${row.entityId} region=${row.regionId} (${row.hexX},${row.hexZ})`,
      }))
    syncSelect(this.claimTotemBuildingSelect, completeBuildingOptions)
    syncSelect(this.housingEntranceBuildingSelect, completeBuildingOptions)
    syncSelect(this.housingNewEntranceSelect, completeBuildingOptions)

    const claimOptions = snapshot.claims.map((row) => ({
      value: row.claimId,
      label: `id=${row.claimId} tier=${row.tier} r=${row.radius} (${row.centerX},${row.centerZ})`,
    }))
    syncSelect(this.claimTargetSelect, claimOptions)

    const housingOptions = snapshot.housings.map((row) => ({
      value: row.entityId,
      label: `id=${row.entityId} region=${row.regionIndex} empty=${row.isEmpty ? 'Y' : 'N'}`,
    }))
    syncSelect(this.housingSelect, housingOptions)

    const selectedHousing = snapshot.housings.find((row) => row.entityId === this.housingSelect.value)
    if (selectedHousing) {
      this.housingTargetRegionInput.value = selectedHousing.regionIndex.toString()
      this.housingIsEmptyCheckbox.checked = selectedHousing.isEmpty
      const rent = snapshot.rents.find((row) => row.entityId === selectedHousing.entityId)
      if (rent && this.housingWhitelistInput.value.trim() === '') {
        this.housingWhitelistInput.value = rent.whiteListIdentityHexes.join(',')
      }
    }
  }

  private updateVisibility(): void {
    this.inventorySection.style.display = this.currentTab === 'inventory' ? 'grid' : 'none'
    this.tradeSection.style.display = this.currentTab === 'trade' ? 'grid' : 'none'
    this.marketSection.style.display = this.currentTab === 'market' ? 'grid' : 'none'
    this.buildSection.style.display = this.currentTab === 'build' ? 'grid' : 'none'
    this.claimSection.style.display = this.currentTab === 'claim' ? 'grid' : 'none'
    this.housingSection.style.display = this.currentTab === 'housing' ? 'grid' : 'none'
    this.body.style.display = this.currentTab ? 'flex' : 'none'

    this.inventoryTabButton.style.background = this.tabBackground('inventory')
    this.tradeTabButton.style.background = this.tabBackground('trade')
    this.marketTabButton.style.background = this.tabBackground('market')
    this.buildTabButton.style.background = this.tabBackground('build')
    this.claimTabButton.style.background = this.tabBackground('claim')
    this.housingTabButton.style.background = this.tabBackground('housing')
  }

  private tabBackground(tab: PanelTab): string {
    return this.currentTab === tab ? 'rgba(117, 171, 255, 0.28)' : 'rgba(19, 30, 48, 0.9)'
  }

  private toggleTab(tab: PanelTab): void {
    this.currentTab = this.currentTab === tab ? null : tab
    this.updateVisibility()
  }

  private applyDisabledState(): void {
    const disabled = this.readOnly
    for (const element of this.root.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>(
      'input, button, select',
    )) {
      if (
        element === this.inventoryTabButton ||
        element === this.tradeTabButton ||
        element === this.marketTabButton ||
        element === this.buildTabButton ||
        element === this.claimTabButton ||
        element === this.housingTabButton
      ) {
        continue
      }
      element.disabled = disabled
    }
  }

  private updatePendingStatus(): void {
    if (!this.pending) {
      return
    }
    if (this.pending.digestBefore !== this.latestDigest) {
      this.pending = null
      return
    }
    if (Date.now() - this.pending.startedAtMs >= PENDING_TIMEOUT_MS) {
      const failure = this.reducerFailureLookup?.(this.pending.label)
      if (failure) {
        this.setToast(`${this.pending.label} failed: ${failure.message}`)
      } else {
        this.setToast(`${this.pending.label} pending timeout, state restored from projection`)
      }
      this.pending = null
    }
  }

  private syncCombinedDigest(): void {
    this.latestDigest = `${this.inventoryDigest}|${this.buildClaimHousingDigest}`
  }

  private resolveHousingTargetId(): string {
    return this.housingSelect.value || this.housingEntityIdInput.value.trim()
  }

  private setToast(message: string): void {
    this.toastLine.textContent = message
  }

  private createTabButton(label: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.style.padding = '6px 8px'
    button.style.borderRadius = '8px'
    button.style.border = '1px solid rgba(137, 185, 255, 0.45)'
    button.style.background = 'rgba(19, 30, 48, 0.9)'
    button.style.color = '#dce9fb'
    button.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
    button.style.fontSize = '11px'
    button.style.cursor = 'pointer'
    return button
  }

  private createInventorySection(): {
    section: HTMLDivElement
    bootstrapButton: HTMLButtonElement
    fromSelect: HTMLSelectElement
    toSelect: HTMLSelectElement
    quantityInput: HTMLInputElement
    moveButton: HTMLButtonElement
  } {
    const section = createSection('Inventory')
    const bootstrapButton = createButton('Bootstrap Inventory')
    const fromSelect = createSelect()
    const toSelect = createSelect()
    const quantityInput = createNumberInput('1')
    const moveButton = createButton('Move Stack')

    section.append(
      createLabeled('Init', bootstrapButton),
      createLabeled('From Slot', fromSelect),
      createLabeled('To Slot', toSelect),
      createLabeled('Quantity', quantityInput),
      moveButton,
    )
    return { section, bootstrapButton, fromSelect, toSelect, quantityInput, moveButton }
  }

  private createTradeSection(): {
    section: HTMLDivElement
    partnerSelect: HTMLSelectElement
    partnerManualInput: HTMLInputElement
    sessionIdInput: HTMLInputElement
    openSessionButton: HTMLButtonElement
    sessionSelect: HTMLSelectElement
    itemSelect: HTMLSelectElement
    quantityInput: HTMLInputElement
    addItemButton: HTMLButtonElement
    acceptedCheckbox: HTMLInputElement
    acceptButton: HTMLButtonElement
  } {
    const section = createSection('Trade')
    const partnerSelect = createSelect()
    const partnerManualInput = createTextInput('manual partner identity (optional)')
    const sessionIdInput = createTextInput('session id (optional)')
    const openSessionButton = createButton('Open Session')
    const sessionSelect = createSelect()
    const itemSelect = createSelect()
    const quantityInput = createNumberInput('1')
    const addItemButton = createButton('Add Item')
    const acceptedCheckbox = document.createElement('input')
    acceptedCheckbox.type = 'checkbox'
    acceptedCheckbox.addEventListener('change', () => {
      this.tradeAcceptDraft = acceptedCheckbox.checked
    })
    const acceptButton = createButton('Apply Accept')

    section.append(
      createLabeled('Partner', partnerSelect),
      createLabeled('Partner Manual', partnerManualInput),
      createLabeled('Session Id', sessionIdInput),
      openSessionButton,
      createLabeled('Session', sessionSelect),
      createLabeled('Inventory Item', itemSelect),
      createLabeled('Quantity', quantityInput),
      addItemButton,
      createLabeled('Accepted', acceptedCheckbox),
      acceptButton,
    )
    return {
      section,
      partnerSelect,
      partnerManualInput,
      sessionIdInput,
      openSessionButton,
      sessionSelect,
      itemSelect,
      quantityInput,
      addItemButton,
      acceptedCheckbox,
      acceptButton,
    }
  }

  private createMarketSection(): {
    section: HTMLDivElement
    orderIdInput: HTMLInputElement
    sideSelect: HTMLSelectElement
    itemDefSelect: HTMLSelectElement
    quantityInput: HTMLInputElement
    unitPriceInput: HTMLInputElement
    placeButton: HTMLButtonElement
    cancelOrderSelect: HTMLSelectElement
    cancelButton: HTMLButtonElement
    matchContainer: HTMLDivElement
    matchBuySelect: HTMLSelectElement
    matchSellSelect: HTMLSelectElement
    matchQuantityInput: HTMLInputElement
    matchButton: HTMLButtonElement
  } {
    const section = createSection('Market')

    const orderIdInput = createTextInput('order id (auto if empty)')
    const sideSelect = createSelect([
      { value: '0', label: '0 (BUY)' },
      { value: '1', label: '1 (SELL)' },
    ])
    const itemDefSelect = createSelect()
    const quantityInput = createNumberInput('1')
    const unitPriceInput = createTextInput('unit price')
    const placeButton = createButton('Place Order')
    const cancelOrderSelect = createSelect()
    const cancelButton = createButton('Cancel Order')

    section.append(
      createLabeled('Order Id', orderIdInput),
      createLabeled('Side', sideSelect),
      createLabeled('Item Def', itemDefSelect),
      createLabeled('Quantity', quantityInput),
      createLabeled('Unit Price', unitPriceInput),
      placeButton,
      createLabeled('My Orders', cancelOrderSelect),
      cancelButton,
    )

    const matchContainer = createSection('Market Match (Test)')
    const matchBuySelect = createSelect()
    const matchSellSelect = createSelect()
    const matchQuantityInput = createNumberInput('1')
    const matchButton = createButton('Match Orders')
    matchContainer.append(
      createLabeled('Buy Order', matchBuySelect),
      createLabeled('Sell Order', matchSellSelect),
      createLabeled('Quantity', matchQuantityInput),
      matchButton,
    )
    matchContainer.style.display = ENABLE_MARKET_MATCH_TEST_ONLY ? 'grid' : 'none'
    section.appendChild(matchContainer)

    return {
      section,
      orderIdInput,
      sideSelect,
      itemDefSelect,
      quantityInput,
      unitPriceInput,
      placeButton,
      cancelOrderSelect,
      cancelButton,
      matchContainer,
      matchBuySelect,
      matchSellSelect,
      matchQuantityInput,
      matchButton,
    }
  }

  private createBuildSection(): {
    section: HTMLDivElement
    regionInput: HTMLInputElement
    hexXInput: HTMLInputElement
    hexZInput: HTMLInputElement
    defSelect: HTMLSelectElement
    buildingIdInput: HTMLInputElement
    placeButton: HTMLButtonElement
    advanceTargetSelect: HTMLSelectElement
    advanceStepsInput: HTMLInputElement
    advanceButton: HTMLButtonElement
    deconstructTargetSelect: HTMLSelectElement
    deconstructButton: HTMLButtonElement
  } {
    const section = createSection('Build')
    const regionInput = createNumberInput('1')
    const hexXInput = createNumberInput('0')
    const hexZInput = createNumberInput('0')
    const defSelect = createSelect()
    const buildingIdInput = createTextInput('building id (optional)')
    const placeButton = createButton('Place Building')
    const advanceTargetSelect = createSelect()
    const advanceStepsInput = createNumberInput('1')
    const advanceButton = createButton('Advance Progress')
    const deconstructTargetSelect = createSelect()
    const deconstructButton = createButton('Deconstruct')

    section.append(
      createLabeled('Region', regionInput),
      createLabeled('Hex X', hexXInput),
      createLabeled('Hex Z', hexZInput),
      createLabeled('Building Def', defSelect),
      createLabeled('Building Id', buildingIdInput),
      placeButton,
      createLabeled('Advance Target', advanceTargetSelect),
      createLabeled('Advance Steps', advanceStepsInput),
      advanceButton,
      createLabeled('Deconstruct Target', deconstructTargetSelect),
      deconstructButton,
    )

    return {
      section,
      regionInput,
      hexXInput,
      hexZInput,
      defSelect,
      buildingIdInput,
      placeButton,
      advanceTargetSelect,
      advanceStepsInput,
      advanceButton,
      deconstructTargetSelect,
      deconstructButton,
    }
  }

  private createClaimSection(): {
    section: HTMLDivElement
    totemBuildingSelect: HTMLSelectElement
    claimIdInput: HTMLInputElement
    radiusInput: HTMLInputElement
    placeButton: HTMLButtonElement
    claimTargetSelect: HTMLSelectElement
    radiusDeltaInput: HTMLInputElement
    expandButton: HTMLButtonElement
  } {
    const section = createSection('Claim')
    const totemBuildingSelect = createSelect()
    const claimIdInput = createTextInput('claim id (optional)')
    const radiusInput = createNumberInput('3')
    const placeButton = createButton('Place Totem')
    const claimTargetSelect = createSelect()
    const radiusDeltaInput = createNumberInput('1')
    const expandButton = createButton('Expand Claim')

    section.append(
      createLabeled('Totem Building', totemBuildingSelect),
      createLabeled('Claim Id', claimIdInput),
      createLabeled('Radius', radiusInput),
      placeButton,
      createLabeled('Claim Target', claimTargetSelect),
      createLabeled('Radius Delta', radiusDeltaInput),
      expandButton,
    )

    return {
      section,
      totemBuildingSelect,
      claimIdInput,
      radiusInput,
      placeButton,
      claimTargetSelect,
      radiusDeltaInput,
      expandButton,
    }
  }

  private createHousingSection(): {
    section: HTMLDivElement
    entranceBuildingSelect: HTMLSelectElement
    housingEntityIdInput: HTMLInputElement
    networkEntityIdInput: HTMLInputElement
    dimensionEntityIdInput: HTMLInputElement
    dimensionIdInput: HTMLInputElement
    interiorInstanceIdInput: HTMLInputElement
    createHousingButton: HTMLButtonElement
    housingSelect: HTMLSelectElement
    portalXInput: HTMLInputElement
    portalYInput: HTMLInputElement
    portalZInput: HTMLInputElement
    enterButton: HTMLButtonElement
    newEntranceSelect: HTMLSelectElement
    targetRegionInput: HTMLInputElement
    movingMinutesInput: HTMLInputElement
    changeEntranceButton: HTMLButtonElement
    isEmptyCheckbox: HTMLInputElement
    respawnDelayInput: HTMLInputElement
    markEmptyButton: HTMLButtonElement
    subjectIdentityInput: HTMLInputElement
    grantUseCheckbox: HTMLInputElement
    grantBuildCheckbox: HTMLInputElement
    grantAdminCheckbox: HTMLInputElement
    propagateButton: HTMLButtonElement
    whitelistInput: HTMLInputElement
    setWhitelistButton: HTMLButtonElement
  } {
    const section = createSection('Housing')
    const entranceBuildingSelect = createSelect()
    const housingEntityIdInput = createTextInput('housing id (optional)')
    const networkEntityIdInput = createTextInput('network id (optional)')
    const dimensionEntityIdInput = createTextInput('dimension entity id (optional)')
    const dimensionIdInput = createNumberInput('1')
    const interiorInstanceIdInput = createTextInput('interior instance id')
    const createHousingButton = createButton('Create Housing')
    const housingSelect = createSelect()
    const portalXInput = createFloatInput('0')
    const portalYInput = createFloatInput('0')
    const portalZInput = createFloatInput('0')
    const enterButton = createButton('Enter Housing')
    const newEntranceSelect = createSelect()
    const targetRegionInput = createNumberInput('1')
    const movingMinutesInput = createNumberInput('0')
    const changeEntranceButton = createButton('Change Entrance')
    const isEmptyCheckbox = document.createElement('input')
    isEmptyCheckbox.type = 'checkbox'
    const respawnDelayInput = createNumberInput('300')
    const markEmptyButton = createButton('Mark Interior Empty')
    const subjectIdentityInput = createTextInput('subject identity hex')
    const grantUseCheckbox = document.createElement('input')
    grantUseCheckbox.type = 'checkbox'
    const grantBuildCheckbox = document.createElement('input')
    grantBuildCheckbox.type = 'checkbox'
    const grantAdminCheckbox = document.createElement('input')
    grantAdminCheckbox.type = 'checkbox'
    const propagateButton = createButton('Propagate Permissions')
    const whitelistInput = createTextInput('identity_hex_a,identity_hex_b,...')
    const setWhitelistButton = createButton('Set Whitelist')

    section.append(
      createLabeled('Entrance Building', entranceBuildingSelect),
      createLabeled('Housing Id', housingEntityIdInput),
      createLabeled('Network Id', networkEntityIdInput),
      createLabeled('Dimension Entity Id', dimensionEntityIdInput),
      createLabeled('Dimension Id', dimensionIdInput),
      createLabeled('Interior Instance Id', interiorInstanceIdInput),
      createHousingButton,
      createLabeled('Housing Target', housingSelect),
      createLabeled('Portal X', portalXInput),
      createLabeled('Portal Y', portalYInput),
      createLabeled('Portal Z', portalZInput),
      enterButton,
      createLabeled('New Entrance', newEntranceSelect),
      createLabeled('Target Region', targetRegionInput),
      createLabeled('Moving Minutes', movingMinutesInput),
      changeEntranceButton,
      createLabeled('Is Empty', isEmptyCheckbox),
      createLabeled('Respawn Delay (s)', respawnDelayInput),
      markEmptyButton,
      createLabeled('Subject Identity', subjectIdentityInput),
      createLabeled('Grant Use', grantUseCheckbox),
      createLabeled('Grant Build', grantBuildCheckbox),
      createLabeled('Grant Admin', grantAdminCheckbox),
      propagateButton,
      createLabeled('Whitelist', whitelistInput),
      setWhitelistButton,
    )

    return {
      section,
      entranceBuildingSelect,
      housingEntityIdInput,
      networkEntityIdInput,
      dimensionEntityIdInput,
      dimensionIdInput,
      interiorInstanceIdInput,
      createHousingButton,
      housingSelect,
      portalXInput,
      portalYInput,
      portalZInput,
      enterButton,
      newEntranceSelect,
      targetRegionInput,
      movingMinutesInput,
      changeEntranceButton,
      isEmptyCheckbox,
      respawnDelayInput,
      markEmptyButton,
      subjectIdentityInput,
      grantUseCheckbox,
      grantBuildCheckbox,
      grantAdminCheckbox,
      propagateButton,
      whitelistInput,
      setWhitelistButton,
    }
  }
}

function deriveAcceptedByLocalIdentity(
  localIdentityHex: string | null,
  selectedSession: TradeSessionSnapshot | undefined,
): boolean {
  if (!localIdentityHex || !selectedSession) {
    return false
  }
  if (selectedSession.initiatorIdentityHex === localIdentityHex) {
    return selectedSession.initiatorAccepted
  }
  if (selectedSession.partnerIdentityHex === localIdentityHex) {
    return selectedSession.partnerAccepted
  }
  return false
}

function syncSelect(select: HTMLSelectElement, options: SelectOption[]): void {
  const previous = select.value
  const signature = options.map((option) => `${option.value}:${option.label}`).join('|')
  if (select.dataset.signature === signature) {
    if (previous && options.some((option) => option.value === previous)) {
      select.value = previous
    }
    return
  }

  select.replaceChildren()
  for (const option of options) {
    const node = document.createElement('option')
    node.value = option.value
    node.textContent = option.label
    select.appendChild(node)
  }
  if (previous && options.some((option) => option.value === previous)) {
    select.value = previous
  }
  select.dataset.signature = signature
}

function computeInventoryDigest(snapshot: InventoryTradeSnapshot): string {
  return [
    snapshot.containers
      .map((row) => `${row.containerId}:${row.slotCount}`)
      .join(','),
    snapshot.items
      .map((row) => `${row.itemInstanceId}:${row.quantity}:${row.slotIndex}`)
      .join(','),
    snapshot.tradeSessions
      .map((row) => `${row.sessionId}:${row.phase}:${row.initiatorAccepted ? 1 : 0}:${row.partnerAccepted ? 1 : 0}`)
      .join(','),
    snapshot.tradeOffers
      .map((row) => `${row.offerKey}:${row.quantity}`)
      .join(','),
    snapshot.marketOrders
      .map((row) => `${row.orderId}:${row.status}:${row.quantityOpen}`)
      .join(','),
    snapshot.marketFills
      .map((row) => `${row.fillId}:${row.quantity}`)
      .join(','),
    snapshot.priceIndex
      .map((row) => `${row.indexKey}:${row.priceAvg}:${row.volume}`)
      .join(','),
    snapshot.wallet?.balance ?? 'none',
  ].join('|')
}

function computeBuildClaimHousingDigest(snapshot: BuildClaimHousingSnapshot): string {
  return [
    snapshot.buildings
      .map((row) => `${row.entityId}:${row.state}:${row.buildProgress}:${row.buildRequired}`)
      .join(','),
    snapshot.claims
      .map((row) => `${row.claimId}:${row.radius}:${row.tier}`)
      .join(','),
    snapshot.housings
      .map((row) => `${row.entityId}:${row.regionIndex}:${row.isEmpty ? 1 : 0}:${row.lockedUntil}`)
      .join(','),
    snapshot.rents
      .map((row) => `${row.entityId}:${row.whiteListIdentityHexes.join(';')}`)
      .join(','),
    snapshot.leases
      .map((row) => `${row.requestNonce}:${row.leasedId}:${row.kind}`)
      .join(','),
    snapshot.lastStatus,
  ].join('|')
}

function createSection(title: string): HTMLDivElement {
  const section = document.createElement('div')
  section.style.display = 'grid'
  section.style.gap = '6px'
  section.style.padding = '6px'
  section.style.border = '1px solid rgba(117, 171, 255, 0.28)'
  section.style.borderRadius = '8px'

  const titleLine = document.createElement('div')
  titleLine.textContent = title
  titleLine.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
  titleLine.style.color = '#cfe1ff'
  titleLine.style.fontSize = '12px'
  titleLine.style.fontWeight = '700'
  section.appendChild(titleLine)
  return section
}

function createLabeled(label: string, control: HTMLElement): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'grid'
  wrapper.style.gap = '4px'

  const text = document.createElement('div')
  text.textContent = label
  text.style.fontFamily = 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
  text.style.fontSize = '10px'
  text.style.color = '#8fbdfc'
  wrapper.append(text, control)
  return wrapper
}

function createButton(label: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.style.padding = '6px 8px'
  button.style.borderRadius = '6px'
  button.style.border = '1px solid rgba(117, 171, 255, 0.45)'
  button.style.background = 'rgba(24, 39, 62, 0.92)'
  button.style.color = '#dce9fb'
  button.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
  button.style.fontSize = '11px'
  button.style.cursor = 'pointer'
  return button
}

function createSelect(initialOptions?: SelectOption[]): HTMLSelectElement {
  const select = document.createElement('select')
  select.style.width = '100%'
  select.style.padding = '6px 8px'
  select.style.borderRadius = '6px'
  select.style.border = '1px solid rgba(117, 171, 255, 0.35)'
  select.style.background = 'rgba(6, 12, 20, 0.9)'
  select.style.color = '#dce9fb'
  select.style.fontFamily = 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
  select.style.fontSize = '11px'
  if (initialOptions) {
    syncSelect(select, initialOptions)
  }
  return select
}

function createTextInput(placeholder: string): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = placeholder
  input.style.width = '100%'
  input.style.padding = '6px 8px'
  input.style.borderRadius = '6px'
  input.style.border = '1px solid rgba(117, 171, 255, 0.35)'
  input.style.background = 'rgba(6, 12, 20, 0.9)'
  input.style.color = '#dce9fb'
  input.style.fontFamily = 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
  input.style.fontSize = '11px'
  return input
}

function createNumberInput(value: string): HTMLInputElement {
  const input = createTextInput('')
  input.type = 'number'
  input.min = '0'
  input.step = '1'
  input.value = value
  return input
}

function createFloatInput(value: string): HTMLInputElement {
  const input = createTextInput('')
  input.type = 'number'
  input.step = '0.1'
  input.value = value
  return input
}
