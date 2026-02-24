import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { WorldSnapshot } from './world-runtime'

interface UiState {
  frameNo: number
  focus: boolean
  lastAoiCell: string
  lastDtMs: number
  focusEventEmitted: boolean
  focusOwner: string | null
}

interface PanelState {
  visible: boolean
  order: number
}

type PanelId = 'HUD' | 'Inventory' | 'Quest' | 'Chat' | 'Map' | 'Settings' | 'Modal' | 'Toast'

const panelOrders: Record<PanelId, number> = {
  HUD: 100,
  Inventory: 200,
  Quest: 200,
  Chat: 200,
  Map: 200,
  Settings: 200,
  Modal: 300,
  Toast: 400,
}

export class UiRuntime implements DomainRuntime {
  name = 'UiRuntime'
  private panel: HTMLDivElement | null = null
  private bus: RuntimeContext['bus'] | null = null
  private state: UiState = {
    frameNo: 0,
    focus: false,
    lastAoiCell: '0,0',
    lastDtMs: 0,
    focusEventEmitted: false,
    focusOwner: null,
  }
  private worldSnapshot: WorldSnapshot | null = null
  private panels = new Map<PanelId, PanelState>()
  private markers = new Map<string, { markerType: string; state: string }>()
  private tableBindings = new Map<string, () => void>()

  async init(ctx: RuntimeContext): Promise<void> {
    this.bus = ctx.bus
    const root = ctx.root
    const container = document.createElement('div')
    container.className = 'clientv2-hud'
    const panel = document.createElement('div')
    panel.className = 'clientv2-panel'
    container.appendChild(panel)
    root.appendChild(container)
    this.panel = panel

    Object.keys(panelOrders).forEach((rawPanel) => {
      const panelId = rawPanel as PanelId
      this.panels.set(panelId, { visible: false, order: panelOrders[panelId] })
      if (panelId === 'HUD') {
        this.panels.set(panelId, { visible: true, order: panelOrders[panelId] })
      }
    })

    document.addEventListener('keydown', this.onKeyDown, true)
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'UI_FOCUS_RELEASE',
      payload: { source: 'ui-runtime-init', value: 'focus-off' },
    })
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') {
      event.preventDefault()
      this.setFocusOwner(this.state.focus ? null : 'ui')
    }
    if (event.key === 'Escape' && this.state.focusOwner === 'ui') {
      this.setFocusOwner(null)
    }
  }

  update(dtMs: number, _ctx: RuntimeContext): void {
    this.state.frameNo += 1
    this.state.lastDtMs = dtMs
    if (!this.panel) {
      return
    }
    const world = this.worldSnapshot
    const sortedPanelRows = Array.from(this.panels.entries())
      .filter(([, value]) => value.visible)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([name, value]) => `${name}(z${value.order})`)
      .join(', ')

    this.panel.innerHTML = `
      <div><strong>stitch-orillusion-clientv2</strong></div>
      <div>frame: ${this.state.frameNo}</div>
      <div>last dt: ${this.state.lastDtMs.toFixed(1)} ms</div>
      <div>aoi cell: ${this.state.lastAoiCell}</div>
      <div>focus: ${this.state.focus ? 'on' : 'off'}</div>
      <div>focus owner: ${this.state.focusOwner ?? 'none'}</div>
      <div>dimension: ${world?.dimensionId ?? '-'}</div>
      <div>time: ${world?.timeOfDaySec ? world.timeOfDaySec.toFixed(0) : '-'}</div>
      <div>weather: ${world?.weather ?? '-'}</div>
      <div>open panels: ${sortedPanelRows || 'none'}</div>
      <div>markers: ${this.markers.size}</div>
    `
  }

  setWorldSnapshot(world: WorldSnapshot): void {
    this.worldSnapshot = world
  }

  setLastAoiCell(cell: string): void {
    this.state.lastAoiCell = cell
  }

  openPanel(panelId: PanelId): void {
    const current = this.panels.get(panelId)
    this.panels.set(panelId, {
      visible: true,
      order: current?.order ?? panelOrders[panelId] ?? 200,
    })
  }

  closePanel(panelId: PanelId): void {
    const current = this.panels.get(panelId)
    if (current) {
      this.panels.set(panelId, { ...current, visible: false })
    }
  }

  setPanelVisible(panelId: PanelId, visible: boolean): void {
    if (visible) {
      this.openPanel(panelId)
    } else {
      this.closePanel(panelId)
    }
  }

  setFocusOwner(owner: string | null): void {
    const wasFocused = Boolean(this.state.focus)
    const nextFocus = Boolean(owner)
    this.state.focusOwner = owner
    this.state.focus = nextFocus
    if (!this.bus) {
      return
    }
    if (nextFocus && !wasFocused) {
      this.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'UI_FOCUS_SET',
        payload: { source: 'setFocusOwner', owner },
      })
      this.state.focusEventEmitted = true
    }
    if (!nextFocus && wasFocused) {
      this.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'UI_FOCUS_RELEASE',
        payload: { source: 'setFocusOwner', owner },
      })
      this.state.focusEventEmitted = false
    }
  }

  attachWorldMarker(entityId: number | bigint, markerType: string): void {
    this.markers.set(`${entityId}`, { markerType, state: 'attached' })
  }

  detachWorldMarker(entityId: number | bigint, markerType: string): void {
    const key = `${entityId}`
    const marker = this.markers.get(key)
    if (!marker || marker.markerType !== markerType) {
      return
    }
    this.markers.delete(key)
  }

  updateMarkerState(entityId: number | bigint, state: string): void {
    const key = `${entityId}`
    const marker = this.markers.get(key)
    if (marker) {
      marker.state = state
    }
  }

  bindTable(tableName: string, _mapper: (row: unknown) => unknown): void {
    this.tableBindings.set(tableName, () => {
      // in this skeleton, mapper is registered for future extension
    })
  }

  async dispose(): Promise<void> {
    if (this.panel?.parentElement) {
      this.panel.parentElement.remove()
    }
    document.removeEventListener('keydown', this.onKeyDown, true)
    this.panels.clear()
    this.markers.clear()
    this.tableBindings.clear()
    this.panel = null
  }
}
