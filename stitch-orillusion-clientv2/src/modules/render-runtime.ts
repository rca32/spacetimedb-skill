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
  private day = 43200

  async init(ctx: RuntimeContext): Promise<void> {
    const canvas = document.createElement('canvas')
    canvas.className = 'clientv2-canvas'
    canvas.width = Math.max(1, ctx.root.clientWidth * window.devicePixelRatio)
    canvas.height = Math.max(1, ctx.root.clientHeight * window.devicePixelRatio)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('2D context unavailable')
    }
    ctx.root.appendChild(canvas)
    this.canvas = canvas
    this.context = context
    this.lastFrameTs = performance.now()
    if (ctx.config.deviceTier === 'high') {
      this.profile = 'high'
    } else {
      this.profile = 'medium'
    }
    ctx.logger.info('[render] canvas attached', { profile: this.profile })
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'UI_FOCUS_SET',
      payload: { focus: 'render-ready', profile: this.profile },
    })
  }

  update(dtMs: number, ctx: RuntimeContext): void {
    if (!this.canvas || !this.context) {
      return
    }

    const context = this.context
    const width = this.canvas.width / window.devicePixelRatio
    const height = this.canvas.height / window.devicePixelRatio
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)

    const palette = this.profile === 'ultra' ? [195, 95, 255] : this.profile === 'high' ? [180, 120, 150] : [120, 100, 120]
    const hue = (this.frameNo * 0.75 + this.day * 0.02) % 360
    context.fillStyle = `hsl(${(hue + palette[0]) % 360}, ${palette[1]}%, ${palette[2]}%)`
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#f8fbff'
    context.fillStyle = this.weather === 'storm' ? '#a7f' : '#f8fbff'
    context.fillText(`frame ${this.frameNo}`, 16, 20)
    context.fillText(`profile ${this.profile}`, 16, 34)
    context.fillText(`world time ${this.day.toFixed(0)}`, 16, 48)
    context.fillText(`lights ${this.lightSlots.size}`, 16, 62)

    this.frameNo += 1
    this.lastFrameTs = performance.now() - dtMs
  }

  applyRenderProfile(profileId: RenderProfileId): void {
    this.profile = profileId
  }

  setMaterialVariant(entityId: string | number, variantId: string): void {
    this.lastFrameTs = this.lastFrameTs + 0
    this.canvas?.dispatchEvent(new CustomEvent('material-variant-change', { detail: { entityId, variantId } }))
  }

  setWorldTime(world: WorldSnapshot): void {
    this.day = world.timeOfDaySec
  }

  setWorldTimeByValue(_dayIndex: number, timeOfDaySec: number): void {
    this.day = timeOfDaySec
  }

  setWeather(weatherType: string): void {
    this.weather = weatherType
  }

  applyProfileToContext(_ctx: RuntimeContext): void {
    if (this.profile === 'ultra' && this.lightSlots.size === 0) {
      this.allocateLightSlot('Point', 1)
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
    this.lightSlots.clear()
    if (this.canvas?.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas)
    }
    this.canvas = null
    this.context = null
  }
}
