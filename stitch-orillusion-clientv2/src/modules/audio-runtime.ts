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

  async init(_ctx: RuntimeContext): Promise<void> {
    this.muted = false
    this.active = []
  }

  update(_dtMs: number, _ctx: RuntimeContext): void {
    const limit = Date.now() - 2000
    this.active = this.active.filter((handle) => handle.startedAt > limit)
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
    if (state.muted || this.getBusVolume(busId) <= 0.001) {
      return null
    }

    if (busId.startsWith('ui') && key.startsWith('ui_')) {
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
    }
    this.active.push(handle)
    return handle
  }

  play3D(
    key: string,
    worldPos: { x: number; y: number; z: number },
    options: { sample?: string; gain?: number; bus?: string; loop?: boolean; radius?: number } = {},
  ): AudioHandle | null {
    // no true spatialization in deterministic skeleton, but keep API for design parity
    if (worldPos.x ** 2 + worldPos.y ** 2 + worldPos.z ** 2 > 45 * 45) {
      return null
    }
    return this.play2D(key, { ...options, sample: '3d' })
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

  bindListenerTo(_entityIdOrCameraId: string): void {
    // placeholder: in skeleton mode there is one global listener
  }

  mapGameEventToAudio(eventCode: string, payload: Record<string, unknown>): string[] {
    if (eventCode === 'combat.hit') {
      return ['rpg_hit_blunt_01']
    }
    if (eventCode === 'skill.cast') {
      return ['fx_skill_cast_01']
    }
    if (eventCode === 'ui.click' || payload?.kind === 'ui_click') {
      return ['ui_click_primary']
    }
    if (payload && payload.ui === true) {
      return ['ui_fallback_click']
    }
    return ['ambient_wind_forest_01']
  }

  setMuted(flag: boolean): void {
    this.muted = flag
  }

  private getBusVolume(busId: string): number {
    const state = this.bus.get(busId)
    if (!state) {
      return 0
    }
    return state.muted ? 0 : state.volume
  }

  getBusState(busId: string): BusState {
    return this.bus.get(busId) ?? { volume: 1, muted: false }
  }

  async dispose(): Promise<void> {
    this.muted = true
    this.active = []
  }
}
