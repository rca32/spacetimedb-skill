import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { AnimationStatePayload, InputFramePayload } from '../core/runtime-events'

type LocomotionState = 'idle' | 'walk' | 'run' | 'jump'
type ActionState = 'none' | 'attack' | 'cast' | 'react' | 'emote'
type FocusState = 'GameOnly' | 'UiOnly' | 'Hybrid' | 'ModalLock'

export class AnimationRuntime implements DomainRuntime {
  name = 'AnimationRuntime'
  private subscriptions: Array<() => void> = []
  private frameNo = 0
  private locomotion: LocomotionState = 'idle'
  private action: ActionState = 'none'
  private actionExpireAt = 0
  private reaction: string | null = null
  private emote: string | null = null
  private emoteExpireAt = 0
  private blink = true
  private morphWeights = new Map<string, number>()
  private currentFocus: FocusState = 'GameOnly'
  private blendHint: 'none' | 'locomotion-to-action' | 'reaction' = 'none'

  async init(ctx: RuntimeContext): Promise<void> {
    this.reset()
    this.subscriptions.push(
      ctx.bus.on('INPUT_FRAME', (event) => {
        const payload = event.payload
        const input = this.toInputPayload(payload)
        if (!input) {
          return
        }
        const speed = Math.min(1.6, Math.hypot(input.move.x, input.move.z))
        this.setLocomotion(speed, input.look.yaw ?? 0)
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('ANIMATION_STATE', (event) => {
        const payload = event.payload as Partial<AnimationStatePayload> | undefined
        if (payload?.state === 'attack') {
          this.playAction(payload.detail ?? 'attack', 1)
          return
        }
        if (payload?.state === 'cast') {
          this.playAction('cast', 1)
          return
        }
        if (payload?.state === 'react') {
          this.setHitReaction(payload.detail ?? 'default', 0.9)
          return
        }
        if (payload?.state === 'emote') {
          this.setEmote(payload.detail ?? 'greet', 220)
          return
        }
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('UI_FOCUS_SET', (event) => {
        const owner = event.payload?.owner
        if (owner) {
          this.currentFocus = owner === 'modal' ? 'ModalLock' : 'UiOnly'
        }
      }),
    )
    this.subscriptions.push(
      ctx.bus.on('UI_FOCUS_RELEASE', () => {
        this.currentFocus = 'GameOnly'
      }),
    )

    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'ANIM_STATE_ENTER',
      payload: { state: this.locomotion, action: this.action, frameNo: this.frameNo },
    })
  }

  update(_dtMs: number, ctx: RuntimeContext): void {
    this.frameNo += 1
    if (this.actionExpireAt > 0 && this.frameNo >= this.actionExpireAt) {
      this.blendHint = this.action !== 'none' ? 'locomotion-to-action' : this.blendHint
      this.action = 'none'
      this.actionExpireAt = 0
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'ANIM_STATE_EXIT',
        payload: { state: 'action', frameNo: this.frameNo },
      })
    }

    if (this.reaction && this.frameNo % 12 === 0) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'ANIM_STATE_EXIT',
        payload: { state: 'react', frameNo: this.frameNo, action: this.reaction },
      })
      this.reaction = null
    }

    if (this.emote && this.frameNo >= this.emoteExpireAt) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'ANIM_STATE_EXIT',
        payload: { state: 'emote', frameNo: this.frameNo, action: this.emote },
      })
      this.emote = null
      this.emoteExpireAt = 0
      this.action = 'none'
    }

    if (this.frameNo % 180 === 0) {
      this.blink = !this.blink
      this.emitMorph(ctx, 'blink', this.blink ? 1 : 0)
    }

    if (this.frameNo % 90 === 0) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'debug',
        event_code: 'ANIM_BLEND',
        payload: {
          blend: this.blendHint,
          locomotion: this.locomotion,
          action: this.action,
          frameNo: this.frameNo,
        },
      })
      this.blendHint = 'none'
    }
  }

  setLocomotion(speed: number, direction = 0): void {
    const next = this.speedToState(speed)
    if (next === this.locomotion) {
      return
    }
    const prev = this.locomotion
    this.locomotion = next
    this.blendHint = 'locomotion-to-action'
    this.emitAnimState('ANIM_STATE_ENTER', { state: next, direction, prev, next })
  }

  playAction(actionId: string, priority: number): void {
    const next = actionId.includes('cast') ? 'cast' : 'attack'
    if (priority <= 0 || (this.action !== 'none' && this.actionExpireAt > this.frameNo)) {
      return
    }
    this.action = next
    this.actionExpireAt = this.frameNo + (next === 'attack' ? 8 : 12)
    this.blendHint = 'reaction'
    this.emitAnimState('ANIM_STATE_ENTER', {
      state: next,
      source: actionId,
      duration: this.actionExpireAt - this.frameNo,
      frameNo: this.frameNo,
    })
  }

  setHitReaction(type: string, intensity: number): void {
    this.reaction = `${type}:${intensity}`
    this.emitAnimState('ANIM_STATE_ENTER', { state: 'react', reaction: this.reaction, frameNo: this.frameNo })
  }

  setEmote(emoteId: string, durationMs = 500): void {
    this.emote = emoteId
    this.action = 'emote'
    this.emoteExpireAt = this.frameNo + Math.max(1, Math.floor(durationMs / 16))
  }

  setMorphWeights(channel: string, weights: number[]): void {
    if (!channel) {
      return
    }
    this.morphWeights.set(channel, Number(weights[0] ?? 0))
  }

  setBlink(state = true): void {
    this.blink = state
    this.emitMorph(undefined, state ? 1 : 0)
  }

  getState(): {
    locomotion: LocomotionState
    action: ActionState
    focus: FocusState
  } {
    return {
      locomotion: this.locomotion,
      action: this.action,
      focus: this.currentFocus,
    }
  }

  async dispose(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.reset()
  }

  private reset(): void {
    this.frameNo = 0
    this.locomotion = 'idle'
    this.action = 'none'
    this.actionExpireAt = 0
    this.reaction = null
    this.emote = null
    this.emoteExpireAt = 0
    this.blendHint = 'none'
    this.blink = true
    this.currentFocus = 'GameOnly'
    this.morphWeights.clear()
  }

  private emitAnimState(event: 'ANIM_STATE_ENTER' | 'ANIM_STATE_EXIT', payload: Record<string, unknown>): void {
    if (!this.ctxRef) {
      return
    }
    this.ctxRef.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: event,
      payload,
    })
  }

  private emitMorph(ctx: RuntimeContext | undefined, value?: number | boolean): void {
    const normalized = typeof value === 'number' ? value : value ? 1 : 0
    this.setMorphWeights('blink', [normalized])
    if (!ctx) {
      return
    }
    ctx.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'MORPH_APPLY',
      payload: { channel: 'blink', value: normalized },
    })
  }

  private speedToState(speed: number): LocomotionState {
    if (Math.abs(speed) < 0.04) {
      return 'idle'
    }
    if (Math.abs(speed) > 1.05) {
      return 'run'
    }
    if (Math.abs(speed) > 0.55) {
      return 'walk'
    }
    return 'jump'
  }

  private ctxRef: RuntimeContext | null = null

  init(ctx: RuntimeContext): Promise<void> {
    this.ctxRef = ctx
    return this._init(ctx)
  }

  private async _init(ctx: RuntimeContext): Promise<void> {
    await Promise.resolve()
    this.reset()
    this.subscriptions.push(
      ctx.bus.on('INPUT_FRAME', (event) => {
        const input = this.toInputPayload(event.payload)
        if (!input) {
          return
        }
        this.setLocomotion(Math.hypot(input.move.x, input.move.z), input.look.pitch)
      }),
    )
  }

  private toInputPayload(payload: unknown): InputFramePayload | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as Partial<InputFramePayload>
    if (!candidate.move || typeof candidate.move !== 'object' || typeof candidate.move.x !== 'number') {
      return null
    }
    return {
      frameNo: Number(candidate.frameNo ?? 0),
      move: {
        x: Number(candidate.move.x),
        y: Number((candidate.move as { y?: number }).y ?? 0),
        z: Number((candidate.move as { z?: number }).z ?? 0),
      },
      look: {
        yaw: Number((candidate.look as { yaw?: number }).yaw ?? 0),
        pitch: Number((candidate.look as { pitch?: number }).pitch ?? 0),
      },
      actions: Array.isArray(candidate.actions) ? (candidate.actions as string[]) : [],
    }
  }
}
