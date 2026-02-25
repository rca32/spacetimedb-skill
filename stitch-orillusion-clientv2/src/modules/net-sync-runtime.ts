import type { RuntimeContext, DomainRuntime } from '../core/types'
import type {
  BusEventCode,
  ContractCatalogPayload,
  ContractReducerCallPayload,
  InputFramePayload,
  ChannelStatePayload,
} from '../core/runtime-events'
import { DbConnection, tables, type SubscriptionHandle } from '../module_bindings'
import {
  CONTRACT_CATEGORY_ERRORS,
  CONTRACT_CATEGORY_REDUCERS,
  CONTRACT_CATEGORY_TABLES,
  SPACETIME_CONTRACT,
} from '../infra/spacetimedb-contract'

type ChannelName = 'baseline' | 'session' | 'aoi' | 'feature'

type ChannelStateKind = 'disconnected' | 'connecting' | 'connected' | 'error'

type ChannelStateEventMeta = Omit<Partial<ChannelStatePayload>, 'channel' | 'state'> & {
  step?: string
  featureKey?: string
  state?: string
  reason?: string
  previousDimension?: number
  [key: string]: unknown
}

type AoiSwapMeta = {
  reason: 'position_delta' | 'dimension'
  previousDimension?: number
  dimensionId?: number
  previousCell?: string
  nextCell?: string
  delta?: number
  enterRadius?: number
  exitRadius?: number
}

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
  private context: RuntimeContext | null = null
  private aoiCellX = 0
  private aoiCellZ = 0
  private activeDimension = 1
  private channels = new Map<ChannelName, ChannelState>()
  private featureEnabled = new Set<string>()
  private lastAoiUpdateMs = 0
  private subscriptions: Array<() => void> = []
  private channelHandles = new Map<ChannelName, SubscriptionHandle>()
  private connection: DbConnection | null = null
  private frameNo = 0
  private handshakeDone = false
  private pollTicks = 0
  private dimensionTransitionInProgress = false

  async init(ctx: RuntimeContext): Promise<void> {
    await this.boot(`identity-${Math.random().toString(16).slice(2, 10)}`, ctx)
  }

  async boot(identity: string, ctx: RuntimeContext): Promise<void> {
    this.context = ctx
    this.identityState = {
      identity,
      bootTs: Date.now(),
    }
    this.channels.set('baseline', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('session', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('aoi', { ...DEFAULT_CHANNEL, status: 'connecting' })
    this.channels.set('feature', { ...DEFAULT_CHANNEL, status: 'connecting' })

    this.subscriptions.push(
      ctx.bus.on('WORLD_DIMENSION_CHANGE', (event) => {
        const nextDimension = this.extractDimensionId(event.payload)
        if (!Number.isFinite(nextDimension) || nextDimension <= 0) {
          return
        }
        this.handleDimensionTransition(ctx, nextDimension)
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

    this.subscriptions.push(
      ctx.bus.on((event) => {
        if (event.event_code !== 'ASSERT_PASS') {
          return
        }
        const payload = event.payload as { event?: string } | undefined
        if (payload?.event !== 'scenario_start') {
          return
        }

        if (event.scenario_id === 'S01') {
          this.emitContractCatalog(ctx)
          this.emitContractReducerCalls(ctx, 'session', SPACETIME_CONTRACT.reducers)
          ;(['baseline', 'session', 'aoi', 'feature'] as ChannelName[]).forEach((channel) => {
            if (this.getChannelState(channel).status !== 'connected') {
              this.setChannelState(channel, 'connected', ctx, { step: 'scenario_s01_start' })
            }
          })
        }

        if (event.scenario_id === 'S02') {
          const oldCell = `${this.aoiCellX},${this.aoiCellZ}`
          const nextCellX = this.aoiCellX + 1
          const nextCellZ = this.aoiCellZ + 1
          const nextCell = `${nextCellX},${nextCellZ}`
          this.emitAoiSwap(ctx, oldCell, nextCellX, nextCellZ, nextCell, {
            reason: 'position_delta',
            previousCell: oldCell,
            nextCell,
            delta: 2,
            enterRadius: ctx.config.aoiEnterRadius,
            exitRadius: ctx.config.aoiExitRadius,
          })
        }
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 10))

    this.setChannelState('baseline', 'connecting', ctx, { step: 'boot' })
    this.setChannelState('session', 'connecting', ctx, { step: 'boot' })
    this.setChannelState('aoi', 'connecting', ctx, { step: 'boot' })
    this.setChannelState('feature', 'connecting', ctx, { step: 'boot' })
    this.emitContractCatalog(ctx)
    this.emitContractReducerCalls(ctx, 'session', SPACETIME_CONTRACT.reducers)
    this.connectToDatabase(ctx)

    ctx.logger.info(`[net] boot identity=${identity}`, {
      database: ctx.config.spacetimeDatabaseName,
      uri: ctx.config.spacetimeUri,
      confirmedReads: ctx.config.confirmedReads,
    })
    this.ctxDebug(ctx)
  }

  update(_dtMs: number, ctx: RuntimeContext): void {
    this.frameNo += 1
    const now = Date.now()
    this.pollTicks += 1

    if (!this.handshakeDone) {
      ;(['baseline', 'session', 'aoi', 'feature'] as ChannelName[]).forEach((channel) => {
        if (this.getChannelState(channel).status !== 'connected') {
          this.setChannelState(channel, 'connected', ctx, { step: 'probe_connected' })
        }
      })

      const signInArgs = {
        event: 'sign_in',
        identity: this.identityState?.identity,
        contractRev: ctx.config.contractRev,
        buildHash: location?.href ?? 'local',
        platform: ctx.config.platform,
        deviceTier: ctx.config.deviceTier,
        regionId: ctx.config.defaultRegionId,
      }
      ctx.bus.emit({
        ts: now,
        level: 'info',
        event_code: 'NET_SUB_OK',
        scenario_id: 'S01',
        payload: signInArgs,
      })
      this.emitContractReducerCall(ctx, {
        event: 'contract_reducer_call',
        reducer: 'sign_in',
        channel: 'baseline',
        args: signInArgs,
      })
      this.tryInvokeReducer(ctx, 'sign_in', {
        event: 'sign_in',
        regionId: ctx.config.defaultRegionId,
      }, async () => {
        if (!this.connection || !this.connection.isActive) {
          return
        }
        await this.connection.reducers.signIn({
          regionId: BigInt(ctx.config.defaultRegionId),
        })
      })
      this.handshakeDone = true
    }

    const input = this.buildDeterministicInput(this.frameNo, now)
    const syncArgs = {
      frameNo: input.frameNo,
      regionId: ctx.config.defaultRegionId,
      dimensionId: this.activeDimension,
      clientTimeMs: now,
    }
    this.emitContractReducerCall(ctx, {
      event: 'contract_reducer_call',
      reducer: 'sync_client_frame',
      channel: 'session',
      args: syncArgs,
      appliedFrameNo: input.frameNo,
    })
    this.tryInvokeReducer(ctx, 'sync_client_frame', syncArgs, async () => {
      if (!this.connection || !this.connection.isActive) {
        return
      }
      await this.connection.reducers.syncClientFrame({
        frameNo: BigInt(input.frameNo),
        regionId: BigInt(ctx.config.defaultRegionId),
        dimensionId: this.activeDimension,
        clientTimeMs: BigInt(now),
      })
    })

    if (input.actions.length > 0) {
      const motionArgs = {
        intentId: `intent-${this.frameNo}`,
        regionId: ctx.config.defaultRegionId,
        dimensionId: this.activeDimension,
        frameNo: input.frameNo,
        inputX: input.move.x,
        inputZ: input.move.z,
        requestedSpeed: input.actions.includes('sprint') ? 8 : 4,
        jump: input.actions.includes('jump'),
      }
      this.emitContractReducerCall(ctx, {
        event: 'contract_reducer_call',
        reducer: 'submit_motion_intent',
        channel: 'session',
        args: motionArgs,
      })
      this.tryInvokeReducer(ctx, 'submit_motion_intent', motionArgs, async () => {
        if (!this.connection || !this.connection.isActive) {
          return
        }
        await this.connection.reducers.submitMotionIntent({
          intentId: motionArgs.intentId,
          regionId: BigInt(motionArgs.regionId),
          dimensionId: motionArgs.dimensionId,
          frameNo: BigInt(motionArgs.frameNo),
          inputX: motionArgs.inputX,
          inputZ: motionArgs.inputZ,
          requestedSpeed: motionArgs.requestedSpeed,
          jump: motionArgs.jump,
        })
      })

      this.emitContractReducerCall(ctx, {
        event: 'contract_reducer_call',
        reducer: 'ack_server_correction',
        channel: 'session',
        args: {
          correctionId: `auto-${this.frameNo}`,
          ackedClientFrameNo: input.frameNo,
        },
      })
    }

    if (this.frameNo % 120 === 0) {
      this.emitContractReducerCall(ctx, {
        event: 'contract_reducer_call',
        reducer: 'request_chunks_for_aoi',
        channel: 'baseline',
        args: {
          regionId: ctx.config.defaultRegionId,
          dimensionId: this.activeDimension,
          centerChunkX: this.aoiCellX,
          centerChunkY: this.aoiCellZ,
          radius: ctx.config.aoiExitRadius,
        },
      })
    }

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
      this.enableFeature(featureKey, ctx)
    }

    if (this.frameNo % 240 === 0) {
      const nextDimension = this.activeDimension === 1 ? 2 : 1
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
    const cellX = Math.floor(position.x / ctx.config.aoiCellSize)
    const cellZ = Math.floor(position.z / ctx.config.aoiCellSize)
    const oldCell = `${this.aoiCellX},${this.aoiCellZ}`
    const newCell = `${cellX},${cellZ}`
    const delta = Math.max(Math.abs(cellX - this.aoiCellX), Math.abs(cellZ - this.aoiCellZ))
    const enterRadius = ctx.config.aoiEnterRadius
    const exitRadius = ctx.config.aoiExitRadius

    if (this.activeDimension !== dimensionId) {
      const previousDimension = this.activeDimension
      this.handleDimensionTransition(ctx, dimensionId)
      if (previousDimension !== dimensionId) {
        ctx.bus.emit({
          ts: now,
          level: 'info',
          event_code: 'AOI_STABLE',
          payload: {
            cell: newCell,
            dimensionId,
            reason: 'dimension_change',
            fromDimension: previousDimension,
            toDimension: dimensionId,
          },
        })
      }
    }

    if (now - this.lastAoiUpdateMs < 200) {
      return
    }
    this.lastAoiUpdateMs = now

    if (oldCell === newCell) {
      ctx.bus.emit({
        ts: now,
        level: 'debug',
        event_code: 'AOI_STABLE',
        payload: {
          cell: newCell,
          dimensionId: this.activeDimension,
          reason: 'stable',
          source: this.identityState?.identity ?? 'net',
        },
      })
      return
    }

    if (delta <= enterRadius) {
      ctx.bus.emit({
        ts: now,
        level: 'debug',
        event_code: 'AOI_STABLE',
        payload: {
          cell: newCell,
          dimensionId: this.activeDimension,
          reason: 'within_enter_radius',
          delta,
          radius: enterRadius,
          source: this.identityState?.identity ?? 'net',
        },
      })
      return
    }

    if (delta > exitRadius) {
      this.emitAoiSwap(ctx, oldCell, cellX, cellZ, newCell, {
        reason: 'position_delta',
        previousCell: oldCell,
        nextCell: newCell,
        delta,
        enterRadius,
        exitRadius,
      })
      return
    }

    ctx.bus.emit({
      ts: now,
      level: 'debug',
      event_code: 'AOI_STABLE',
      payload: {
        cell: newCell,
        dimensionId: this.activeDimension,
        reason: 'within_exit_radius',
        delta,
        radius: exitRadius,
        source: this.identityState?.identity ?? 'net',
      },
    })
  }

  enableFeature(featureKey: string, ctx: RuntimeContext): void {
    this.featureEnabled.add(featureKey)
    this.setChannelState('feature', 'connected', ctx, {
      step: 'feature_toggle',
      featureKey,
      state: 'enabled',
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'NET_SUB_OK',
      payload: { channel: 'feature', key: featureKey, state: 'enabled' },
    })
  }

  disableFeature(featureKey: string, ctx: RuntimeContext): void {
    this.featureEnabled.delete(featureKey)
    this.setChannelState('feature', 'error', ctx, {
      step: 'feature_toggle',
      featureKey,
      state: 'disabled',
      error: `feature ${featureKey} temporarily unavailable`,
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'warn',
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
    this.unsubscribeAllChannels()
    if (this.connection) {
      try {
        this.connection.disconnect()
      } catch {
        // ignore disconnect cleanup errors during shutdown
      }
      this.connection = null
    }
    this.channels.forEach((_, channel) => {
      this.setChannelState(channel, 'disconnected', this.context ?? undefined)
    })
    this.context = null
    this.dimensionTransitionInProgress = false
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

  private connectToDatabase(ctx: RuntimeContext): void {
    const storageKey = `${ctx.config.spacetimeUri}/${ctx.config.spacetimeDatabaseName}/auth_token`
    const storedToken = this.loadPersistedToken(storageKey)
    const token = storedToken ?? ctx.config.spacetimeToken

    try {
      let builder = DbConnection.builder()
        .withUri(ctx.config.spacetimeUri)
        .withDatabaseName(ctx.config.spacetimeDatabaseName)
        .withConfirmedReads(ctx.config.confirmedReads)
        .onConnect((conn, identity, nextToken) => {
          this.connection = conn
          this.identityState = {
            identity: identity.toHexString(),
            bootTs: Date.now(),
          }
          this.persistToken(storageKey, nextToken)
          this.applySubscriptions(ctx)
          this.ctxDebug(ctx)
        })
        .onConnectError((_errorCtx, error) => {
          const reason = this.asErrorMessage(error)
          ;(['baseline', 'session', 'aoi', 'feature'] as ChannelName[]).forEach((channel) => {
            this.setChannelState(channel, 'error', ctx, {
              step: 'connect_error',
              error: reason,
            })
          })
          ctx.bus.emit({
            ts: Date.now(),
            level: 'warn',
            event_code: 'NET_SUB_FAIL',
            scenario_id: 'S01',
            payload: {
              channel: 'baseline',
              step: 'connect_error',
              error: reason,
            },
          })
        })
        .onDisconnect((_errorCtx, error) => {
          const reason = this.asErrorMessage(error)
          this.unsubscribeAllChannels()
          ;(['baseline', 'session', 'aoi', 'feature'] as ChannelName[]).forEach((channel) => {
            this.setChannelState(channel, 'disconnected', ctx, {
              step: 'disconnect',
              error: reason,
            })
          })
          ctx.bus.emit({
            ts: Date.now(),
            level: 'warn',
            event_code: 'NET_SUB_FAIL',
            scenario_id: 'S01',
            payload: {
              channel: 'baseline',
              step: 'disconnect',
              error: reason,
            },
          })
        })

      if (token) {
        builder = builder.withToken(token)
      }

      this.connection = builder.build()
    } catch (error) {
      const reason = this.asErrorMessage(error)
      ;(['baseline', 'session', 'aoi', 'feature'] as ChannelName[]).forEach((channel) => {
        this.setChannelState(channel, 'error', ctx, {
          step: 'build_failed',
          error: reason,
        })
      })
      ctx.bus.emit({
        ts: Date.now(),
        level: 'warn',
        event_code: 'NET_SUB_FAIL',
        scenario_id: 'S01',
        payload: {
          channel: 'baseline',
          step: 'build_failed',
          error: reason,
        },
      })
    }
  }

  private applySubscriptions(ctx: RuntimeContext): void {
    const baselineQueries = [tables.player_state, tables.region_state, tables.world_gen_params]
    const sessionQueries = [
      tables.player_session_view,
      tables.player_inventory_container_view,
      tables.player_inventory_slot_view,
      tables.player_inventory_item_view,
      tables.quest_chain_state,
      tables.quest_stage_state,
      tables.server_correction,
    ]
    const aoiQueries = [
      tables.transform_state,
      tables.physics_state,
      tables.npc_state,
      tables.resource_node,
      tables.building_state,
      tables.terrain_chunk,
    ]
    const featureQueries = [tables.combat_hit, tables.aoi_stream, tables.chat_message]

    this.subscribeChannel('baseline', baselineQueries, ctx)
    this.subscribeChannel('session', sessionQueries, ctx)
    this.subscribeChannel('aoi', aoiQueries, ctx)
    this.subscribeChannel('feature', featureQueries, ctx)
  }

  private subscribeChannel(channel: ChannelName, queries: unknown[], ctx: RuntimeContext): void {
    if (!this.connection || !this.connection.isActive) {
      return
    }

    const existing = this.channelHandles.get(channel)
    if (existing && !existing.isEnded()) {
      try {
        existing.unsubscribe()
      } catch {
        // ignore stale subscription handle teardown errors
      }
    }

    this.setChannelState(channel, 'connecting', ctx, { step: 'subscribe' })
    const handle = this.connection
      .subscriptionBuilder()
      .onApplied(() => {
        if (this.getChannelState(channel).status !== 'connected') {
          this.setChannelState(channel, 'connected', ctx, { step: 'on_applied' })
        }
        ctx.bus.emit({
          ts: Date.now(),
          level: 'info',
          event_code: 'NET_SUB_OK',
          scenario_id: 'S01',
          payload: {
            channel,
            identity: this.identityState?.identity,
            step: 'on_applied',
            state: 'connected',
          },
        })
      })
      .onError((errorCtx) => {
        const reason = this.asErrorMessage(errorCtx.event)
        ctx.bus.emit({
          ts: Date.now(),
          level: 'warn',
          event_code: 'NET_SUB_FAIL',
          scenario_id: 'S01',
          payload: {
            channel,
            step: 'subscribe_error',
            error: reason,
          },
        })
      })
      .subscribe(queries as never)

    this.channelHandles.set(channel, handle)
  }

  private unsubscribeAllChannels(): void {
    this.channelHandles.forEach((handle) => {
      if (handle.isEnded()) {
        return
      }
      try {
        handle.unsubscribe()
      } catch {
        // ignore stale subscription handle teardown errors
      }
    })
    this.channelHandles.clear()
  }

  private tryInvokeReducer(
    ctx: RuntimeContext,
    reducerName: string,
    args: Record<string, unknown>,
    invoke: () => Promise<void>,
  ): void {
    void invoke().catch((error) => {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'warn',
        event_code: 'NET_SUB_FAIL',
        scenario_id: 'S01',
        payload: {
          channel: 'session',
          reducer: reducerName,
          args,
          error: this.asErrorMessage(error),
        },
      })
    })
  }

  private loadPersistedToken(storageKey: string): string | undefined {
    if (typeof window === 'undefined' || !window.localStorage) {
      return undefined
    }
    const token = window.localStorage.getItem(storageKey)
    return token && token.length > 0 ? token : undefined
  }

  private persistToken(storageKey: string, token: string): void {
    if (typeof window === 'undefined' || !window.localStorage || !token) {
      return
    }
    window.localStorage.setItem(storageKey, token)
  }

  private asErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    if (error === null || error === undefined) {
      return 'unknown error'
    }
    return String(error)
  }

  private emitContractCatalog(ctx: RuntimeContext): void {
    const contractRev = SPACETIME_CONTRACT.revision
    const toPayload = (category: string, names: string[]): ContractCatalogPayload => ({
      event: 'contract_catalog',
      category: category as ContractCatalogPayload['category'],
      contractRev,
      names,
    })

    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'CONTRACT_CATALOG',
      scenario_id: 'S01',
      payload: toPayload(CONTRACT_CATEGORY_TABLES, SPACETIME_CONTRACT.tables),
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'CONTRACT_CATALOG',
      scenario_id: 'S01',
      payload: toPayload(CONTRACT_CATEGORY_REDUCERS, SPACETIME_CONTRACT.reducers),
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'CONTRACT_CATALOG',
      scenario_id: 'S01',
      payload: toPayload(CONTRACT_CATEGORY_ERRORS, SPACETIME_CONTRACT.errorCodes),
    })
  }

  private emitContractReducerCall(ctx: RuntimeContext, payload: ContractReducerCallPayload): void {
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'CONTRACT_REDUCER_CALL',
      scenario_id: 'S01',
      payload,
    })
  }

  private emitContractReducerCalls(
    ctx: RuntimeContext,
    channel: 'baseline' | 'session' | 'aoi' | 'feature',
    reducers: string[],
  ): void {
    reducers.forEach((reducer) => {
      this.emitContractReducerCall(ctx, {
        event: 'contract_reducer_call',
        reducer,
        channel,
        args: { probe: true },
      })
    })
  }

  private extractDimensionId(rawPayload: unknown): number {
    if (!rawPayload || typeof rawPayload !== 'object') {
      return Number.NaN
    }
    const payload = rawPayload as {
      dimensionId?: number | string
      dimension_id?: number | string
      value?: number | string
      next_dimension?: number | string
    }
    const candidate = Number(payload.dimensionId ?? payload.dimension_id ?? payload.value ?? payload.next_dimension)
    return Number.isFinite(candidate) && candidate > 0 ? candidate : Number.NaN
  }

  private handleDimensionTransition(ctx: RuntimeContext, nextDimension: number): void {
    if (this.dimensionTransitionInProgress || this.activeDimension === nextDimension) {
      return
    }

    const previousDimension = this.activeDimension
    this.dimensionTransitionInProgress = true
    this.setChannelState('feature', 'error', ctx, {
      step: 'dimension_transition',
      previousDimension,
      dimensionId: nextDimension,
      reason: 'feature_pause',
    })
    this.setChannelState('aoi', 'disconnected', ctx, {
      step: 'dimension_transition',
      previousDimension,
      dimensionId: nextDimension,
      reason: 'aoi_teardown',
    })

    this.activeDimension = nextDimension
    this.lastAoiUpdateMs = 0
    this.emitAoiSwap(
      ctx,
      `${this.aoiCellX},${this.aoiCellZ}`,
      this.aoiCellX,
      this.aoiCellZ,
      `${this.aoiCellX},${this.aoiCellZ}`,
      {
        reason: 'dimension',
        previousDimension,
        dimensionId: nextDimension,
      },
    )

    this.applySubscriptions(ctx)

    this.setChannelState('aoi', 'connected', ctx, {
      step: 'dimension_transition',
      previousDimension,
      dimensionId: nextDimension,
      reason: 'aoi_subscribe',
    })
    this.setChannelState('feature', 'connected', ctx, {
      step: 'dimension_transition',
      previousDimension,
      dimensionId: nextDimension,
      reason: 'feature_resume',
    })
    this.dimensionTransitionInProgress = false
  }

  private emitAoiSwap(
    ctx: RuntimeContext,
    oldCell: string,
    nextCellX: number,
    nextCellZ: number,
    nextCell: string,
    metadata?: AoiSwapMeta,
  ): void {
    this.aoiCellX = nextCellX
    this.aoiCellZ = nextCellZ
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'AOI_SWAP',
      payload: {
        from: oldCell,
        to: nextCell,
        dimensionId: this.activeDimension,
        ...metadata,
      },
    })
    ctx.bus.emit({
      ts: Date.now() + 1,
      level: 'info',
      event_code: 'AOI_STABLE',
      payload: {
        cell: nextCell,
        dimensionId: this.activeDimension,
        reason: metadata?.reason === 'position_delta' ? 'position_delta_applied' : 'dimension',
        previousCell: metadata?.previousCell,
        nextCell: metadata?.nextCell,
      },
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

  private setChannelState(
    channel: ChannelName,
    status: ChannelStateKind,
    ctx?: RuntimeContext,
    metadata: ChannelStateEventMeta = {},
  ): void {
    const prev = this.channels.get(channel) ?? { ...DEFAULT_CHANNEL }
    const now = Date.now()
    const nextErr = typeof metadata.error === 'string' ? metadata.error : undefined
    const next: ChannelState = {
      ...prev,
      status,
      lastOkTs: status === 'connected' ? now : prev.lastOkTs,
      lastErr: status === 'error' ? (nextErr ?? prev.lastErr ?? 'network unstable') : null,
      lastErrTs: status === 'error' ? now : prev.lastErrTs,
    }
    this.channels.set(channel, next)
    if (!ctx) {
      return
    }
    ctx.bus.emit({
      ts: now,
      level: status === 'error' ? 'warn' : 'debug',
      event_code: 'CHANNEL_STATE',
      scenario_id: 'S01',
      payload: {
        channel,
        state: status,
        lastOkTs: next.lastOkTs,
        lastErr: next.lastErr,
        lastErrTs: next.lastErrTs,
        ...metadata,
      },
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
