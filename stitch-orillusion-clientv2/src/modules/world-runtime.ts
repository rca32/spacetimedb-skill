import type { RuntimeContext, DomainRuntime } from '../core/types'

export type WorldWeather = 'clear' | 'windy' | 'rain' | 'storm'

export interface WorldSnapshot {
  frameNo: number
  dimensionId: number
  timeOfDaySec: number
  weather: WorldWeather
  dayIndex: number
  profileId: 'low' | 'medium' | 'high' | 'ultra'
}

interface EntityPatch {
  id: bigint
  position?: { x: number; y: number; z: number }
  state?: string
}

export class WorldRuntime implements DomainRuntime {
  name = 'WorldRuntime'
  private frameNo = 0
  private dimensionId = 1
  private timeOfDaySec = 43200
  private dayIndex = 0
  private weather: WorldWeather = 'clear'
  private nextWeatherFlipMs = 0
  private entities = new Map<bigint, EntityPatch>()

  async init(_ctx: RuntimeContext): Promise<void> {
    this.frameNo = 0
    this.timeOfDaySec = 43200
    this.nextWeatherFlipMs = Date.now() + 6000
  }

  update(dtMs: number, _ctx: RuntimeContext): void {
    this.frameNo += 1
    const delta = dtMs / 1000
    this.timeOfDaySec = (this.timeOfDaySec + delta) % 86400
    if (this.timeOfDaySec < delta) {
      this.dayIndex += 1
    }
  }

  updateWorldTime(ctx: RuntimeContext): void {
    const now = Date.now()
    const previousWeather = this.weather
    if (now > this.nextWeatherFlipMs) {
      const cycle: WorldWeather[] = ['clear', 'windy', 'rain', 'storm']
      this.weather = cycle[(cycle.indexOf(this.weather) + 1) % cycle.length]
      this.nextWeatherFlipMs = now + 6000
    }
    if (previousWeather !== this.weather) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'NET_SUB_OK',
        payload: {
          event: 'weather',
          previous: previousWeather,
          current: this.weather,
          dimensionId: this.dimensionId,
        },
      })
    }
  }

  setDimension(dimensionId: number): void {
    this.dimensionId = dimensionId
  }

  spawnEntity(entityId: bigint, snapshot: { x: number; y: number; z: number }): void {
    this.entities.set(entityId, { id: entityId, position: snapshot })
  }

  applyDelta(delta: EntityPatch): void {
    const current = this.entities.get(delta.id) ?? { id: delta.id }
    this.entities.set(delta.id, { ...current, ...delta })
  }

  despawnEntity(entityId: bigint): void {
    this.entities.delete(entityId)
  }

  queryEntity(entityId: bigint): { id: bigint; position?: { x: number; y: number; z: number }; state?: string } | null {
    return this.entities.get(entityId) ?? null
  }

  readSnapshot(): WorldSnapshot {
    const profileId = this.frameNo > 1500 ? 'ultra' : this.frameNo > 900 ? 'high' : this.frameNo > 300 ? 'medium' : 'low'
    return {
      frameNo: this.frameNo,
      dimensionId: this.dimensionId,
      timeOfDaySec: this.timeOfDaySec,
      weather: this.weather,
      dayIndex: this.dayIndex,
      profileId,
    }
  }

  async dispose(): Promise<void> {
    this.entities.clear()
    this.frameNo = 0
  }
}
