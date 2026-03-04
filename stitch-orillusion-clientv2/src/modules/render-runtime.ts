import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { WorldSnapshot } from './world-runtime'

type RenderProfileId = 'low' | 'medium' | 'high' | 'ultra'

interface LightSlot {
  slotId: number
  type: 'Directional' | 'Point' | 'Spot'
  priority: number
}

export class RenderRuntime implements DomainRuntime {
  name = 'RenderRuntime'
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private frameNo = 0
  private lastFrameTs = 0
  private profile: RenderProfileId = 'high'
  private lightSlots = new Map<number, LightSlot>()
  private nextSlotId = 1
  private weather = 'clear'
  private daySec = 43200
  private subscriptions: Array<() => void> = []
  private loadedTextures = 0

  async init(ctx: RuntimeContext): Promise<void> {
    this.profile = this.profileFromDeviceTier(ctx.config.deviceTier)
    this.lastFrameTs = performance.now()

    const canvas = document.createElement('canvas')
    canvas.className = 'clientv2-canvas'
    const width = Math.max(1, ctx.root.clientWidth * window.devicePixelRatio)
    const height = Math.max(1, ctx.root.clientHeight * window.devicePixelRatio)
    canvas.width = Math.floor(width)
    canvas.height = Math.floor(height)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('2D context unavailable')
    }

    ctx.root.appendChild(canvas)
    this.canvas = canvas
    this.context = context

    this.subscriptions.push(
      ctx.bus.on('WORLD_STATE_APPLIED', (event) => {
        const payload = event.payload as
          | { dayIndex?: unknown; timeOfDaySec?: unknown; weather?: unknown; frameNo?: unknown; profile?: unknown }
          | undefined
        if (!payload) {
          return
        }
        if (typeof payload.timeOfDaySec === 'number') {
          this.daySec = payload.timeOfDaySec
        }
        if (typeof payload.weather === 'string') {
          this.weather = payload.weather
        }
        if (typeof payload.profile === 'string') {
          const nextProfile = payload.profile
          if (nextProfile === 'low' || nextProfile === 'medium' || nextProfile === 'high' || nextProfile === 'ultra') {
            this.applyRenderProfile(nextProfile)
          }
        }
        ctx.bus.emit({
          ts: Date.now(),
          level: 'info',
          event_code: 'RENDER_WORLD_TIME',
          payload: {
            daySec: this.daySec,
            weather: this.weather,
            frameNo: payload.frameNo,
          },
        })
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('WORLD_TICK', (event) => {
        const payload = event.payload as { weather?: unknown }
        if (payload?.weather === 'storm') {
          this.applyProfileToContext(ctx)
        }
      }),
    )

    ctx.logger.info('[render] canvas attached', { profile: this.profile })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'RENDER_PROFILE',
      payload: { profile: this.profile },
    })
  }

  update(dtMs: number, ctx: RuntimeContext): void {
    if (!this.canvas || !this.context) {
      return
    }
    const context = this.context
    const width = this.canvas.width / window.devicePixelRatio
    const height = this.canvas.height / window.devicePixelRatio
    const deltaMs = Math.max(0, dtMs)

    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)

    const gradient = this.weatherGradient(context, width, height)
    context.clearRect(0, 0, width, height)
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#eef7ff'
    context.fillText(`frame ${this.frameNo}`, 16, 20)
    context.fillText(`profile ${this.profile}`, 16, 34)
    context.fillText(`world time ${this.daySec.toFixed(0)}s`, 16, 48)
    context.fillText(`weather ${this.weather}`, 16, 62)
    context.fillText(`lights ${this.lightSlots.size}`, 16, 76)
    context.fillText(`textures ${this.loadedTextures}`, 16, 90)
    context.fillText(`dt ${deltaMs.toFixed(2)}ms`, 16, 104)

    this.frameNo += 1
    this.lastFrameTs = performance.now()
  }

  applyRenderProfile(profileId: RenderProfileId): void {
    if (this.profile === profileId) {
      return
    }
    this.profile = profileId
    for (const [slotId, slot] of this.lightSlots.entries()) {
      if (profileId === 'low' && slot.type !== 'Directional') {
        this.lightSlots.delete(slotId)
      }
    }
  }

  setMaterialVariant(entityId: string | number, variantId: string): void {
    this.canvas?.dispatchEvent(
      new CustomEvent('material-variant-change', {
        detail: { entityId, variantId },
      }),
    )
    this.loadedTextures += 1
  }

  setWorldTime(world: WorldSnapshot): void {
    this.daySec = world.timeOfDaySec
    this.setWeather(world.weather)
  }

  setWorldTimeByValue(dayIndex: number, timeOfDaySec: number): void {
    this.daySec = timeOfDaySec
  }

  setWeather(weatherType: string): void {
    this.weather = weatherType
    if (!this.canvas) {
      return
    }
    this.canvas?.dispatchEvent(
      new CustomEvent('weather-change', {
        detail: { weather: this.weather, daySec: this.daySec },
      }),
    )
  }

  applyProfileToContext(_ctx: RuntimeContext): void {
    if (!this.context) {
      return
    }
    if (this.profile === 'ultra' && this.lightSlots.size === 0) {
      this.allocateLightSlot('Point', 1)
    }
    if (this.profile === 'low') {
      this.releaseAllLights((slot) => slot.priority < 3)
    }
  }

  allocateLightSlot(type: 'Directional' | 'Point' | 'Spot', priority = 0): LightSlot {
    const slotId = this.nextSlotId
    this.nextSlotId += 1
    const slot: LightSlot = { slotId, type, priority }
    this.lightSlots.set(slotId, slot)
    return slot
  }

  releaseLightSlot(slotId: number): void {
    this.lightSlots.delete(slotId)
  }

  async dispose(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.lightSlots.clear()
    if (this.canvas?.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas)
    }
    this.canvas = null
    this.context = null
  }

  private releaseAllLights(filter: (slot: LightSlot) => boolean): void {
    for (const [slotId, slot] of this.lightSlots.entries()) {
      if (filter(slot)) {
        this.lightSlots.delete(slotId)
      }
    }
  }

  private weatherGradient(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): string | CanvasGradient {
    const palette = this.weather === 'storm' ? ['hsl(220 50% 22%)', 'hsl(250 35% 40%)'] : this.weather === 'rain' ? ['hsl(210 45% 34%)', 'hsl(228 40% 30%)'] : ['hsl(195 95% 62%)', 'hsl(180 95% 35%)']
    if (this.profile === 'low') {
      return palette[1]
    }
    const gradient = context.createLinearGradient(0, 0, Math.max(1, width * 0.85), Math.max(1, height))
    gradient.addColorStop(0, palette[0])
    gradient.addColorStop(1, palette[1])
    return gradient
  }

  private profileFromDeviceTier(tier: 'low' | 'mid' | 'high'): RenderProfileId {
    if (tier === 'low') {
      return 'low'
    }
    if (tier === 'high') {
      return 'high'
    }
    return 'medium'
  }
}
