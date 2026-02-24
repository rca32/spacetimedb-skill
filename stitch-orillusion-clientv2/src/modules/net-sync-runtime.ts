import type { RuntimeContext, DomainRuntime } from '../core/types'

type ChannelName = 'baseline' | 'session' | 'aoi' | 'feature'

type ChannelStateKind = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ChannelState {
  status: ChannelStateKind
  lastOkTs: number | null
  lastErr: string | null
  lastErrTs: number | null
}

export interface IdentityState {
  identity: string
  bootTs: number
}

const DEFAULT_CHANNEL: ChannelState = {
  status: 'disconnected',
  lastOkTs: null,
  lastErr: null,
  lastErrTs: null,
}

export class NetSyncRuntime implements DomainRuntime {
  name = 'NetSyncRuntime'
  private identityState: IdentityState | null = null
  private aoiCellX = 0
  private aoiCellZ = 0
  private activeDimension = 1
  private channels = new Map<ChannelName, ChannelState>()
  private featureEnabled = new Set<string>()
  private lastAoiUpdateMs = 0

  async init(ctx: RuntimeContext): Promise<void> {
    await this.boot(`identity-${Math.random().toString(16).slice(2, 10)}`, ctx)
  }

  async boot(identity: string, ctx: RuntimeContext): Promise<void> {
    this.identityState = {
      identity,
      bootTs: Date.now(),
    }
    ctx.logger.info(`[net] boot identity=${identity}`)
    this.channels.set('baseline', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('session', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('aoi', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('feature', { ...DEFAULT_CHANNEL, status: 'disconnected' })

    await new Promise((resolve) => setTimeout(resolve, 10))

    this.setChannelState('baseline', 'connected')
    this.setChannelState('session', 'connected')
    this.setChannelState('aoi', 'connected')
    this.setChannelState('feature', 'connected')
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'NET_SUB_OK',
      payload: { channel: 'baseline', identity, step: 'boot' },
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'NET_SUB_OK',
      payload: { channel: 'session', identity, step: 'boot' },
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'NET_SUB_OK',
      payload: { channel: 'aoi', identity, step: 'boot' },
    })
    this.ctxDebug(ctx)
  }

  update(_dtMs: number, _ctx: RuntimeContext): void {
    // network poll placeholder, intentionally light-weight
  }

  updateAoi(
    position: { x: number; y: number; z: number },
    dimensionId: number,
    ctx: RuntimeContext,
  ): void {
    const now = Date.now()
    if (this.activeDimension !== dimensionId || now - this.lastAoiUpdateMs < 200) {
      if (this.activeDimension !== dimensionId) {
        this.activeDimension = dimensionId
        this.emitAoiSwap(ctx, 'dimension', this.aoiCellX, this.aoiCellZ, `${this.aoiCellX},${this.aoiCellZ}`)
      }
      if (now - this.lastAoiUpdateMs < 200) {
        return
      }
    }

    this.lastAoiUpdateMs = now
    const cellX = Math.floor(position.x / ctx.config.aoiCellSize)
    const cellZ = Math.floor(position.z / ctx.config.aoiCellSize)
    const oldCell = `${this.aoiCellX},${this.aoiCellZ}`
    const newCell = `${cellX},${cellZ}`
    const delta = Math.max(Math.abs(cellX - this.aoiCellX), Math.abs(cellZ - this.aoiCellZ))

    if (oldCell === newCell) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'debug',
        event_code: 'AOI_STABLE',
        payload: { cell: newCell, dimensionId: this.activeDimension },
      })
      return
    }

    if (delta <= ctx.config.aoiExitRadius) {
      // hysteresis guard keeps current subscription for soft boundary movement.
      if (delta > ctx.config.aoiEnterRadius) {
        this.emitAoiSwap(ctx, oldCell, cellX, cellZ, newCell)
      }
      return
    }

    this.emitAoiSwap(ctx, oldCell, cellX, cellZ, newCell)
  }

  enableFeature(featureKey: string, ctx: RuntimeContext): void {
    this.featureEnabled.add(featureKey)
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'NET_SUB_OK',
      payload: { channel: 'feature', key: featureKey, state: 'enabled' },
    })
  }

  disableFeature(featureKey: string, ctx: RuntimeContext): void {
    this.featureEnabled.delete(featureKey)
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'NET_SUB_FAIL',
      payload: { channel: 'feature', key: featureKey, state: 'disabled' },
    })
  }

  getChannelState(channel: ChannelName): ChannelState {
    const state = this.channels.get(channel)
    return {
      ...(state ?? DEFAULT_CHANNEL),
      status: state?.status ?? DEFAULT_CHANNEL.status,
    }
  }

  getIdentity(): string {
    return this.identityState?.identity ?? ''
  }

  bootState(): IdentityState | null {
    return this.identityState
  }

  async dispose(): Promise<void> {
    this.channels.forEach((state, channel) => {
      this.channels.set(channel, {
        ...state,
        status: 'disconnected',
        lastOkTs: Date.now(),
      })
    })
  }

  private emitAoiSwap(
    ctx: RuntimeContext,
    oldCell: string,
    nextCellX: number,
    nextCellZ: number,
    nextCell: string,
  ): void {
    this.aoiCellX = nextCellX
    this.aoiCellZ = nextCellZ
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'AOI_SWAP',
      payload: { from: oldCell, to: nextCell, dimensionId: this.activeDimension },
    })
    ctx.bus.emit({
      ts: Date.now() + 1,
      level: 'info',
      event_code: 'AOI_STABLE',
      payload: { cell: nextCell, dimensionId: this.activeDimension },
    })
  }

  private ctxDebug(ctx: RuntimeContext): void {
    const states = {
      baseline: this.getChannelState('baseline'),
      session: this.getChannelState('session'),
      aoi: this.getChannelState('aoi'),
      feature: this.getChannelState('feature'),
    }
    ctx.logger.debug('[net] channel states', states)
  }

  private setChannelState(channel: ChannelName, status: ChannelStateKind): void {
    const prev = this.channels.get(channel) ?? { ...DEFAULT_CHANNEL }
    this.channels.set(channel, {
      ...prev,
      status,
      lastOkTs: status === 'connected' ? Date.now() : prev.lastOkTs,
      lastErr: status === 'error' ? prev.lastErr ?? 'network unstable' : null,
      lastErrTs: status === 'error' ? Date.now() : prev.lastErrTs,
    })
  }
}
