import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { InputFramePayload, BusEventCode } from '../core/runtime-events'

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
  private subscriptions: Array<() => void> = []
  private frameNo = 0
  private handshakeDone = false
  private pollTicks = 0

  async init(ctx: RuntimeContext): Promise<void> {
    await this.boot(`identity-${Math.random().toString(16).slice(2, 10)}`, ctx)
  }

  async boot(identity: string, ctx: RuntimeContext): Promise<void> {
    this.identityState = {
      identity,
      bootTs: Date.now(),
    }
    this.channels.set('baseline', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('session', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('aoi', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('feature', { ...DEFAULT_CHANNEL, status: 'disconnected' })

    this.subscriptions.push(
      ctx.bus.on('WORLD_DIMENSION_CHANGE', (event) => {
        if (!event.payload?.value) {
          return
        }
        const nextDimension = Number(event.payload.value)
        if (!Number.isFinite(nextDimension) || nextDimension <= 0) {
          return
        }
        this.activeDimension = nextDimension
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('SCENARIO_MARK', (event) => {
        const scenarioId = event.payload?.scenario_id
        if (scenarioId === 'S03' || scenarioId === 'S05') {
          const payload = event.payload as { mode?: string } | undefined
          this.requestFeatureSync(payload?.mode as BusEventCode | undefined)
        }
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    this.setChannelState('baseline', 'connected')
    this.setChannelState('session', 'connected')
    this.setChannelState('aoi', 'connected')
    this.setChannelState('feature', 'connected')

    const startedAt = Date.now()
    ;['baseline', 'session', 'aoi', 'feature'].forEach((channel) => {
      ctx.bus.emit({
        ts: startedAt,
        level: 'info',
        event_code: 'NET_SUB_OK',
        scenario_id: 'S01',
        payload: {
          channel,
          identity,
          step: 'boot',
          state: this.getChannelState(channel as ChannelName).status,
        },
      })
    })

    ctx.logger.info(`[net] boot identity=${identity}`)
    this.ctxDebug(ctx)
  }

  update(_dtMs: number, ctx: RuntimeContext): void {
    this.frameNo += 1
    const now = Date.now()
    this.pollTicks += 1

    if (!this.handshakeDone) {
      ctx.bus.emit({
        ts: now,
        level: 'info',
        event_code: 'NET_SUB_OK',
        scenario_id: 'S01',
        payload: {
          event: 'client_hello_v2',
          identity: this.identityState?.identity,
          contractRev: ctx.config.contractRev,
          buildHash: location?.href ?? 'local',
          platform: ctx.config.platform,
          deviceTier: ctx.config.deviceTier,
        },
      })
      this.handshakeDone = true
    }

    const input = this.buildDeterministicInput(this.frameNo, now)
    ctx.bus.emit({
      ts: now,
      level: 'debug',
      event_code: 'INPUT_FRAME',
      scenario_id: 'S02',
      payload: input,
    })

    if (this.pollTicks % 2 === 0) {
      ctx.bus.emit({
        ts: now,
        level: 'debug',
        event_code: 'INPUT_APPLIED',
        payload: {
          frameNo: this.frameNo,
          channel: 'session',
          dimensionId: this.activeDimension,
          sequence: this.pollTicks,
        },
      })
    }

    if (this.pollTicks % 30 === 0) {
      const featureKey = `feature:${this.pollTicks % 3}`
      if (this.featureEnabled.has(featureKey)) {
        this.disableFeature(featureKey, ctx)
      } else {
        this.enableFeature(featureKey, ctx)
      }
    }

    if (this.frameNo % 240 === 0) {
      const nextDimension = this.activeDimension === 1 ? 2 : 1
      this.activeDimension = nextDimension
      ctx.bus.emit({
        ts: now,
        level: 'info',
        event_code: 'WORLD_DIMENSION_CHANGE',
        scenario_id: 'S05',
        payload: {
          channel: 'dimension',
          value: nextDimension,
          reason: 'deterministic_cycle',
          source: this.identityState?.identity ?? 'net',
        },
      })
    }

    if (_dtMs < 0 || Number.isNaN(_dtMs)) {
      ctx.bus.emit({
        ts: now,
        level: 'warn',
        event_code: 'NET_SUB_FAIL',
        payload: { event: 'invalid-delta', dtMs: _dtMs },
      })
    }
  }

  updateAoi(
    position: { x: number; y: number; z: number },
    dimensionId: number,
    ctx: RuntimeContext,
  ): void {
    const now = Date.now()
    if (this.activeDimension !== dimensionId) {
      this.activeDimension = dimensionId
      this.emitAoiSwap(ctx, 'dimension', this.aoiCellX, this.aoiCellZ, `${this.aoiCellX},${this.aoiCellZ}`)
    }

    if (now - this.lastAoiUpdateMs < 200) {
      return
    }

    const cellX = Math.floor(position.x / ctx.config.aoiCellSize)
    const cellZ = Math.floor(position.z / ctx.config.aoiCellSize)
    const oldCell = `${this.aoiCellX},${this.aoiCellZ}`
    const newCell = `${cellX},${cellZ}`
    const delta = Math.max(Math.abs(cellX - this.aoiCellX), Math.abs(cellZ - this.aoiCellZ))

    if (oldCell === newCell) {
      ctx.bus.emit({
        ts: now,
        level: 'debug',
        event_code: 'AOI_STABLE',
        payload: {
          cell: newCell,
          dimensionId: this.activeDimension,
          source: this.identityState?.identity ?? 'net',
        },
      })
      return
    }

    if (delta <= ctx.config.aoiEnterRadius) {
      if (delta > ctx.config.aoiExitRadius) {
        // keep soft boundary for near-cell movement.
        this.emitAoiSwap(ctx, oldCell, cellX, cellZ, newCell)
      }
      return
    }

    this.lastAoiUpdateMs = now
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
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    this.channels.forEach((state, channel) => {
      this.channels.set(channel, {
        ...state,
        status: 'disconnected',
        lastOkTs: Date.now(),
      })
    })
  }

  private requestFeatureSync(mode: BusEventCode | undefined): void {
    if (!mode) {
      return
    }
    this.pollTicks = 0
    if (mode === 'enable') {
      ;['feature:combat', 'feature:audio', 'feature:ui'].forEach((key) => {
        this.featureEnabled.add(key)
      })
    }
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

  private buildDeterministicInput(frameNo: number, nowMs: number): InputFramePayload {
    const phase = frameNo / 60
    const x = Math.cos(phase)
    const z = Math.sin(phase)
    const yaw = (frameNo * 1.5) % 360
    const pitch = ((Math.sin(nowMs / 1000) + 1) / 2) * 10
    const actions: string[] = []

    if (frameNo % 90 === 0) {
      actions.push('jump')
    }
    if (frameNo % 200 === 0) {
      actions.push('sprint')
    }

    return {
      frameNo,
      move: { x, y: 0, z },
      look: { yaw, pitch },
      actions,
    }
  }
}
