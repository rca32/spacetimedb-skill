import type {
  InventoryTradeActionResult,
  InventoryTradeActions,
  InventoryTradeSnapshot,
  TradeSessionSnapshot,
} from '../../runtime/types'

type PanelTab = 'inventory' | 'trade' | 'market'

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

const PENDING_TIMEOUT_MS = 1500
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

  private readonly inventorySection: HTMLDivElement
  private readonly tradeSection: HTMLDivElement
  private readonly marketSection: HTMLDivElement

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

  private actions: InventoryTradeActions | null = null
  private reducerFailureLookup: ((name: string) => ReducerFailure | null) | null = null
  private reducerFailureClear: ((name: string) => void) | null = null
  private currentSnapshot: InventoryTradeSnapshot | null = null
  private currentTab: PanelTab | null = null
  private readOnly = true
  private pending: PendingAction | null = null
  private latestDigest = ''
  private tradeAcceptDraft: boolean | null = null

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.right = '12px'
    this.root.style.bottom = '12px'
    this.root.style.width = '360px'
    this.root.style.maxHeight = '58vh'
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
    this.toolbar.style.display = 'flex'
    this.toolbar.style.gap = '6px'

    this.inventoryTabButton = this.createTabButton('I Inventory')
    this.tradeTabButton = this.createTabButton('T Trade')
    this.marketTabButton = this.createTabButton('M Market')
    this.toolbar.append(this.inventoryTabButton, this.tradeTabButton, this.marketTabButton)

    this.body = document.createElement('div')
    this.body.style.display = 'none'
    this.body.style.flexDirection = 'column'
    this.body.style.gap = '10px'
    this.body.style.maxHeight = '44vh'
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

    this.body.append(this.inventorySection, this.tradeSection, this.marketSection)
    this.root.append(this.summaryLine, this.modeLine, this.toastLine, this.toolbar, this.body)
    container.appendChild(this.root)

    this.bindEvents()
    this.setText('inactive')
    this.setReadOnly(true)
  }

  bindInventoryTrade(actions: InventoryTradeActions): void {
    this.actions = actions
  }

  bindReducerFailureAccess(
    getFailure: (name: string) => ReducerFailure | null,
    clearFailure: (name: string) => void,
  ): void {
    this.reducerFailureLookup = getFailure
    this.reducerFailureClear = clearFailure
  }

  renderInventoryTrade(snapshot: InventoryTradeSnapshot): void {
    this.currentSnapshot = snapshot
    this.latestDigest = computeDigest(snapshot)
    this.refreshInventoryUi(snapshot)
    this.refreshTradeUi(snapshot)
    this.refreshMarketUi(snapshot)
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

    this.inventoryBootstrapButton.addEventListener('click', () => {
      this.dispatchAction('inventory_bootstrap', () => this.actions?.bootstrapInventory())
    })

    this.inventoryMoveButton.addEventListener('click', () => {
      if (!this.currentSnapshot) {
        return
      }
      const fromSlot = this.currentSnapshot.slots.find((slot) => slot.slotKey === this.inventoryFromSelect.value)
      const toSlot = this.currentSnapshot.slots.find((slot) => slot.slotKey === this.inventoryToSelect.value)
      const quantity = Number.parseInt(this.inventoryQuantityInput.value, 10)
      if (!fromSlot || !toSlot) {
        this.setToast('slot selection is required')
        return
      }
      this.dispatchAction('item_stack_move', () =>
        this.actions?.moveItemStack({
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
        this.actions?.openTradeSession({
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
        this.actions?.addTradeItem({
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
        this.actions?.setTradeAccept({
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
        this.actions?.placeMarketOrder({
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
      this.dispatchAction('market_order_cancel', () => this.actions?.cancelMarketOrder({ orderId }))
    })

    this.marketMatchButton.addEventListener('click', () => {
      const buyOrderId = this.marketMatchBuySelect.value
      const sellOrderId = this.marketMatchSellSelect.value
      const quantity = Number.parseInt(this.marketMatchQuantityInput.value, 10)
      if (!buyOrderId || !sellOrderId) {
        this.setToast('buy/sell orders are required')
        return
      }
      if (this.currentSnapshot) {
        const buyOrder = this.currentSnapshot.marketOrders.find((order) => order.orderId === buyOrderId)
        if (buyOrder && this.currentSnapshot.wallet === null) {
          this.setToast('wallet not initialized; buyer wallet funding is required for market match')
          return
        }
      }
      this.dispatchAction('market_order_match', () =>
        this.actions?.matchMarketOrderTestOnly({
          buyOrderId,
          sellOrderId,
          quantity: Number.isFinite(quantity) ? quantity : 0,
        }),
      )
    })
  }

  private dispatchAction(name: string, dispatch: () => InventoryTradeActionResult | undefined): void {
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

  private updateVisibility(): void {
    this.inventorySection.style.display = this.currentTab === 'inventory' ? 'grid' : 'none'
    this.tradeSection.style.display = this.currentTab === 'trade' ? 'grid' : 'none'
    this.marketSection.style.display = this.currentTab === 'market' ? 'grid' : 'none'
    this.body.style.display = this.currentTab ? 'flex' : 'none'

    this.inventoryTabButton.style.background = this.currentTab === 'inventory' ? 'rgba(117, 171, 255, 0.28)' : 'rgba(19, 30, 48, 0.9)'
    this.tradeTabButton.style.background = this.currentTab === 'trade' ? 'rgba(117, 171, 255, 0.28)' : 'rgba(19, 30, 48, 0.9)'
    this.marketTabButton.style.background = this.currentTab === 'market' ? 'rgba(117, 171, 255, 0.28)' : 'rgba(19, 30, 48, 0.9)'
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
      if (element === this.inventoryTabButton || element === this.tradeTabButton || element === this.marketTabButton) {
        continue
      }
      element.disabled = disabled
    }
  }

  private updatePendingStatus(): void {
    if (!this.pending || !this.currentSnapshot) {
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

  private setToast(message: string): void {
    this.toastLine.textContent = message
  }

  private createTabButton(label: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.style.flex = '1'
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

function computeDigest(snapshot: InventoryTradeSnapshot): string {
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
  input.min = '1'
  input.step = '1'
  input.value = value
  return input
}
