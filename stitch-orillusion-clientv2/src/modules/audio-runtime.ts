import type { RuntimeContext, DomainRuntime } from '../core/types'

interface BusState {
  volume: number
  muted: boolean
}

interface AudioHandle {
  id: string
  key: string
  startedAt: number
  loop: boolean
  bus: string
}

export class AudioRuntime implements DomainRuntime {
  name = 'AudioRuntime'
  private muted = false
  private bus = new Map<string, BusState>([
    ['master', { volume: 1, muted: false }],
    ['bgm', { volume: 1, muted: false }],
    ['sfx', { volume: 1, muted: false }],
    ['ui', { volume: 1, muted: false }],
    ['ambient', { volume: 1, muted: false }],
    ['voice', { volume: 1, muted: false }],
  ])
  private active: AudioHandle[] = []
  private uiRateWindow = new Map<string, number>()
  private subscriptions: Array<() => void> = []
  private listenerBind: string | null = null

  async init(ctx: RuntimeContext): Promise<void> {
    this.muted = false
    this.active = []
    this.listenerBind = 'player-camera'

    this.subscriptions.push(
      ctx.bus.on('FX_EMIT', (event) => {
        const payload = event.payload as { eventType?: string; source?: string; intensity?: number } | undefined
        const cues = this.mapFxToAudio(payload)
        cues.forEach((cue) => {
          this.play2D(cue, { bus: 'sfx', gain: Number(payload?.intensity ?? 1) * 0.65 })
        })
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('WORLD_STATE_APPLIED', (event) => {
        const payload = event.payload as { weather?: string }
        if (payload?.weather === 'rain' || payload?.weather === 'storm') {
          this.play2D('ambient_wind_forest_01', {
            bus: 'ambient',
            sample: 'loop',
            loop: true,
            gain: 0.15,
          })
        }
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('AUDIO_PLAY', (event) => {
        const payload = event.payload as { key?: string; bus?: string; gain?: number } | undefined
        if (!payload?.key || !payload?.bus) {
          return
        }
        this.play2D(payload.key, { bus: payload.bus, gain: payload.gain })
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('WORLD_STATE_APPLIED', (event) => {
        if (event.payload?.weather === 'rain') {
          this.setBusVolume('ambient', 0.8)
        } else {
          this.setBusVolume('ambient', 0.4)
        }
      }),
    )
  }

  update(_dtMs: number, ctx: RuntimeContext): void {
    const limit = Date.now() - 2000
    this.active = this.active.filter((handle) => handle.startedAt > limit)

    if (this.listenerBind) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'debug',
        event_code: 'AUDIO_PLAY',
        payload: {
          event: 'listener_bound',
          listener: this.listenerBind,
          active: this.active.length,
        },
      })
    }
  }

  play2D(
    key: string,
    options: { sample?: string; gain?: number; bus?: string; loop?: boolean } = {},
  ): AudioHandle | null {
    if (this.muted) {
      return null
    }

    const busId = options.bus ?? 'sfx'
    const state = this.bus.get(busId) ?? { volume: 1, muted: false }
    const gain = Number(options.gain ?? 1)
    if (state.muted || this.getBusVolume(busId) <= 0.001 || gain <= 0) {
      return null
    }

    if (busId === 'ui' && options.sample === 'ui') {
      const now = Date.now()
      const last = this.uiRateWindow.get('ui') ?? 0
      if (now - last < 120) {
        return null
      }
      this.uiRateWindow.set('ui', now)
    }

    const handle: AudioHandle = {
      id: `${busId}:${key}:${Math.random().toString(16).slice(2, 10)}`,
      key,
      startedAt: Date.now(),
      loop: options.loop ?? false,
      bus: busId,
    }
    this.active.push(handle)
    return handle
  }

  play3D(
    key: string,
    worldPos: { x: number; y: number; z: number },
    options: { sample?: string; gain?: number; bus?: string; loop?: boolean; radius?: number } = {},
  ): AudioHandle | null {
    if (worldPos.x ** 2 + worldPos.y ** 2 + worldPos.z ** 2 > 45 * 45) {
      return null
    }
    return this.play2D(key, { ...options, sample: options.sample ?? '3d' })
  }

  stop(handle: AudioHandle): void {
    this.active = this.active.filter((candidate) => candidate.id !== handle.id)
  }

  setBusVolume(busId: string, volume01: number): void {
    const clamped = Math.max(0, Math.min(1, volume01))
    const state = this.bus.get(busId) ?? { volume: 1, muted: false }
    this.bus.set(busId, { ...state, volume: clamped })
  }

  setMute(busId: string, muted: boolean): void {
    const state = this.bus.get(busId) ?? { volume: 1, muted: false }
    this.bus.set(busId, { ...state, muted })
  }

  bindListenerTo(entityIdOrCameraId: string): void {
    this.listenerBind = entityIdOrCameraId
  }

  mapGameEventToAudio(eventCode: string, payload: Record<string, unknown>): string[] {
    if (eventCode === 'combat.hit' || eventCode === 'combat.crit') {
      return ['rpg_hit_blunt_01']
    }
    if (eventCode === 'skill.cast' || eventCode === 'skill.impact') {
      return ['fx_skill_cast_01']
    }
    if (eventCode === 'ui.alert' || eventCode === 'ui_click') {
      return ['ui_click_primary']
    }
    if (payload?.weather === 'storm' || payload?.weather === 'rain') {
      return ['ambient_wind_forest_01']
    }
    return ['ui_fallback_click']
  }

  setMuted(flag: boolean): void {
    this.muted = flag
  }

  getBusState(busId: string): BusState {
    return this.bus.get(busId) ?? { volume: 1, muted: false }
  }

  async dispose(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.muted = true
    this.active = []
  }

  private getBusVolume(busId: string): number {
    const state = this.bus.get(busId)
    if (!state) {
      return 0
    }
    return state.muted ? 0 : state.volume
  }

  private mapFxToAudio(payload: { eventType?: string; source?: string; intensity?: number } | undefined): string[] {
    if (!payload?.eventType) {
      return []
    }
    const mapped = this.mapGameEventToAudio(payload.eventType, payload)
    return mapped.filter(Boolean)
  }
}
