import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { FxEventPayload } from '../core/runtime-events'

interface FxQueueItem {
  eventType: string
  sourceEntityId?: bigint
  targetEntityId?: bigint
  presetId: string
  position?: { x: number; y: number; z: number }
  normal?: { x: number; y: number; z: number }
  intensity?: number
  ttlMs?: number
  startedAt: number
}

interface FxPreset {
  presetId: string
  profile: 'low' | 'medium' | 'high' | 'ultra'
  maxParticles: number
}

export class FxRuntime implements DomainRuntime {
  name = 'FxRuntime'
  private subscriptions: Array<() => void> = []
  private active: FxQueueItem[] = []
  private queue: FxQueueItem[] = []
  private presets = new Map<string, FxPreset>()
  private profile: 'low' | 'medium' | 'high' | 'ultra' = 'low'
  private frameNo = 0
  private dropped = 0

  async init(ctx: RuntimeContext): Promise<void> {
    this.profile = this.profileFromDeviceTier(ctx.config.deviceTier)

    this.registerPreset('fx_hit_spark_01', { presetId: 'fx_hit_spark_01', profile: 'low', maxParticles: 64 })
    this.registerPreset('fx_crit_burst_01', { presetId: 'fx_crit_burst_01', profile: 'high', maxParticles: 128 })
    this.registerPreset('fx_skill_fireball_impact_01', {
      presetId: 'fx_skill_fireball_impact_01',
      profile: 'high',
      maxParticles: 128,
    })
    this.registerPreset('fx_ambient_dust_01', { presetId: 'fx_ambient_dust_01', profile: 'low', maxParticles: 64 })
    this.registerPreset('fx_ui_warning_ring_01', { presetId: 'fx_ui_warning_ring_01', profile: 'medium', maxParticles: 32 })

    this.subscriptions.push(
      ctx.bus.on('ANIMATION_STATE', (event) => {
        const state = String(event.payload?.state ?? '')
        if (state === 'attack') {
          this.emitFx({
            eventType: 'combat.hit',
            sourceEntityId: 1n,
            targetEntityId: 1n,
            position: { x: 0, y: 0, z: 0 },
            intensity: 0.7,
            ttlMs: 600,
          })
        }
        if (state === 'react') {
          this.emitFx({
            eventType: 'ambient.loop',
            sourceEntityId: 1n,
            position: { x: 0, y: 0, z: 0 },
            intensity: 0.2,
            ttlMs: 500,
          })
        }
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('FX_TRIGGER', (event) => {
        const payload = event.payload as FxEventPayload | undefined
        if (!payload) {
          return
        }
        const presets = this.mapServerEventToFx(payload.eventType, payload)
        presets.forEach((presetId) => {
          this.emitFx({
            eventType: payload.eventType,
            sourceEntityId: BigInt(payload.sourceEntityId ?? 1),
            targetEntityId: payload.targetEntityId ? BigInt(payload.targetEntityId) : undefined,
            position: payload.position,
            normal: payload.normal,
            intensity: payload.intensity,
            ttlMs: payload.ttlMs ?? 600,
            presetOverride: presetId,
          })
        })
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('WORLD_STATE_APPLIED', (event) => {
        const payload = event.payload as { weather?: unknown; event?: string }
        if (payload?.event === 'weather_change') {
          this.emitFx({
            eventType: String((payload as { weather?: string }).weather ?? 'ambient.loop'),
            sourceEntityId: 1n,
            position: { x: 0, y: 0, z: 0 },
            intensity: 0.2,
            ttlMs: 700,
          })
        }
      }),
    )

    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'FX_EMIT',
      payload: { event: 'runtime_init', profile: this.profile, presetCount: this.presets.size },
    })
  }

  update(dtMs: number, ctx: RuntimeContext): void {
    this.frameNo += 1
    const now = Date.now()
    const dtSec = Math.max(0.001, dtMs / 1000)

    this.active = this.active.filter((item) => {
      const ttl = item.ttlMs ?? 600
      return now - item.startedAt < ttl
    })

    while (this.queue.length > 0) {
      const next = this.queue.shift()
      if (!next) {
        continue
      }
      if (this.active.length < this.presetLimit()) {
        this.active.push(next)
        ctx.bus.emit({
          ts: now,
          level: 'info',
          event_code: 'FX_EMIT',
          payload: {
            frameNo: this.frameNo,
            eventType: next.eventType,
            presetId: next.presetId,
            source: next.sourceEntityId?.toString(),
            target: next.targetEntityId?.toString(),
          },
        })
      } else {
        this.dropped += 1
      }
    }

    if (this.dropped > 0) {
      this.dropped = Math.max(0, this.dropped - dtSec * 5)
      ctx.bus.emit({
        ts: now,
        level: 'debug',
        event_code: 'FX_EMIT',
        payload: { event: 'drop_rate', dropped: this.dropped, active: this.active.length },
      })
    }
  }

  emitFx(event: {
    eventType: string
    sourceEntityId?: number | bigint
    targetEntityId?: number | bigint
    position?: { x: number; y: number; z: number }
    normal?: { x: number; y: number; z: number }
    intensity?: number
    ttlMs?: number
    presetOverride?: string
  }): void {
    const presetList = event.presetOverride ? [event.presetOverride] : this.mapServerEventToFx(event.eventType, event)
    const id = presetList[0]
    if (!id) {
      return
    }

    const item: FxQueueItem = {
      eventType: event.eventType,
      sourceEntityId: this.normalizeEntity(event.sourceEntityId),
      targetEntityId: this.normalizeEntity(event.targetEntityId),
      presetId: id,
      position: event.position,
      normal: event.normal,
      intensity: event.intensity,
      ttlMs: event.ttlMs ?? 600,
      startedAt: Date.now(),
    }
    this.queue.push(item)
  }

  registerPreset(presetId: string, config: FxPreset): void {
    this.presets.set(presetId, config)
  }

  setFxProfile(profile: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.profile = profile
  }

  drainFxQueue(maxCount = 64): FxQueueItem[] {
    return this.queue.splice(0, maxCount)
  }

  mapServerEventToFx(eventType: string, _payload: Record<string, unknown>): string[] {
    switch (eventType) {
      case 'combat.hit':
      case 'combat_impact':
        return ['fx_hit_spark_01']
      case 'combat.crit':
      case 'critical_hit':
        return ['fx_crit_burst_01']
      case 'skill.cast':
      case 'skill_cast':
        return ['fx_skill_fireball_impact_01']
      case 'ambient.loop':
      case 'weather':
        return ['fx_ambient_dust_01']
      case 'ui.alert':
      case 'ui_alert':
      case 'ui.warning':
        return ['fx_ui_warning_ring_01']
      default:
        return []
    }
  }

  private presetLimit(): number {
    switch (this.profile) {
      case 'ultra':
        return 384
      case 'high':
        return 256
      case 'medium':
        return 128
      default:
        return 64
    }
  }

  trigger(_ctx: RuntimeContext, presetId: string): void {
    this.emitFx({
      eventType: 'ui.alert',
      presetOverride: presetId,
      ttlMs: 600,
    })
  }

  private profileFromDeviceTier(tier: 'low' | 'mid' | 'high'): 'low' | 'medium' | 'high' | 'ultra' {
    if (tier === 'low') {
      return 'low'
    }
    if (tier === 'high') {
      return 'high'
    }
    return 'medium'
  }

  private normalizeEntity(entityId?: number | bigint): bigint | undefined {
    if (entityId === undefined) {
      return undefined
    }
    return typeof entityId === 'number' ? BigInt(Math.floor(entityId)) : entityId
  }

  async dispose(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.queue = []
    this.active = []
    this.dropped = 0
    this.presets.clear()
  }
}
