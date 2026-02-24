import type { RuntimeContext, DomainRuntime } from '../core/types'

interface FxQueueItem {
  eventType: string
  sourceEntityId?: bigint
  targetEntityId?: bigint
  position?: { x: number; y: number; z: number }
  normal?: { x: number; y: number; z: number }
  intensity?: number
  ttlMs?: number
  startedAt: number
}

interface FxPreset {
  presetId: string
  profile: 'low' | 'mid' | 'high' | 'ultra'
  maxParticles: number
}

export class FxRuntime implements DomainRuntime {
  name = 'FxRuntime'
  private active: FxQueueItem[] = []
  private queue: FxQueueItem[] = []
  private presets = new Map<string, FxPreset>()
  private profile: 'low' | 'mid' | 'high' | 'ultra' = 'low'
  private frameNo = 0

  async init(ctx: RuntimeContext): Promise<void> {
    this.profile = ctx.config.deviceTier === 'high' ? 'high' : 'low'
    this.registerPreset('fx_hit_spark_01', { presetId: 'fx_hit_spark_01', profile: 'low', maxParticles: 64 })
    this.registerPreset('fx_crit_burst_01', { presetId: 'fx_crit_burst_01', profile: 'high', maxParticles: 128 })
    this.registerPreset('fx_skill_fireball_impact_01', {
      presetId: 'fx_skill_fireball_impact_01',
      profile: 'high',
      maxParticles: 128,
    })
    ctx.logger.debug('[fx] ready')
  }

  update(dtMs: number, _ctx: RuntimeContext): void {
    this.frameNo += 1
    const now = Date.now()
    this.active = this.active.filter((event) => {
      const ttl = event.ttlMs ?? 600
      if (now - event.startedAt >= ttl) {
        return false
      }
      return true
    })

    while (this.queue.length > 0) {
      const next = this.queue.shift()
      if (!next) {
        continue
      }
      this.active.push(next)
    }
    if (dtMs > 0 && this.active.length > this.presetLimit()) {
      this.active.splice(0, this.active.length - this.presetLimit())
    }
  }

  trigger(ctx: RuntimeContext, name: string): void {
    this.emitFx({
      event_type: name,
      source_entity_id: 1n,
      target_entity_id: 2n,
      position: { x: 0, y: 0, z: 0 },
      ttl_ms: 600,
    })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'FX_EMIT',
      payload: { effect: name, profile: this.profile, active: this.active.length },
    })
  }

  emitFx(event: {
    event_type: string
    source_entity_id?: bigint
    target_entity_id?: bigint
    position?: { x: number; y: number; z: number }
    normal?: { x: number; y: number; z: number }
    intensity?: number
    ttl_ms?: number
    payload?: Record<string, unknown>
  }): void {
    this.queue.push({
      eventType: event.event_type,
      sourceEntityId: event.source_entity_id,
      targetEntityId: event.target_entity_id,
      position: event.position,
      normal: event.normal,
      intensity: event.intensity,
      ttlMs: event.ttl_ms,
      startedAt: Date.now(),
    })
  }

  registerPreset(presetId: string, config: FxPreset): void {
    this.presets.set(presetId, config)
  }

  setFxProfile(profile: 'low' | 'mid' | 'high' | 'ultra'): void {
    this.profile = profile
  }

  drainFxQueue(maxCount = 64): FxQueueItem[] {
    return this.queue.splice(0, maxCount)
  }

  mapServerEventToFx(eventType: string, payload: Record<string, unknown>): string[] {
    if (eventType === 'combat.hit') {
      return ['fx_hit_spark_01']
    }
    if (eventType === 'combat.crit') {
      return ['fx_crit_burst_01']
    }
    if (eventType === 'skill.impact') {
      return ['fx_skill_fireball_impact_01']
    }
    if (payload?.ambient === true) {
      return ['fx_ambient_dust_01']
    }
    return []
  }

  private presetLimit(): number {
    switch (this.profile) {
      case 'ultra':
        return 384
      case 'high':
        return 256
      case 'mid':
        return 128
      default:
        return 64
    }
  }

  async dispose(): Promise<void> {
    this.active = []
    this.queue = []
  }
}
