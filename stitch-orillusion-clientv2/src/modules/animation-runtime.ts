import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { AnimationStatePayload, InputFramePayload } from '../core/runtime-events'

type LocomotionState = 'idle' | 'walk' | 'run' | 'jump'
type ActionState = 'none' | 'attack' | 'cast' | 'react' | 'emote'
type FocusState = 'GameOnly' | 'UiOnly' | 'Hybrid' | 'ModalLock'

export class AnimationRuntime implements DomainRuntime {
  name = 'AnimationRuntime'
  private ctx: RuntimeContext | null = null
  private frameNo = 0
  private subscriptions: Array<() => void> = []
  private locomotion: LocomotionState = 'idle'
  private action: ActionState = 'none'
  private actionExpireAt = 0
  private actionSource: string | null = null
  private reaction: string | null = null
  private emote: string | null = null
  private emoteExpireAt = 0
  private focus: FocusState = 'GameOnly'
  private blink = true
  private morphWeights = new Map<string, number>()

  async init(ctx: RuntimeContext): Promise<void> {
    this.ctx = ctx
    this.reset()

    this.subscriptions.push(
      ctx.bus.on('INPUT_FRAME', (event) => {
        const input = this.asInputFrame(event.payload)
        if (!input) {
          return
        }
        this.setLocomotion(Math.hypot(input.move.x, input.move.z), input.look.yaw)
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
          this.setEmote(payload.detail ?? 'greet', 240)
          return
        }
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('UI_FOCUS_SET', (event) => {
        const owner = event.payload?.owner as string | undefined
        if (!owner) {
          return
        }
        this.focus = owner === 'modal' ? 'ModalLock' : 'UiOnly'
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('UI_FOCUS_RELEASE', () => {
        this.focus = 'GameOnly'
      }),
    )

    this.emitAnimationState('ANIM_STATE_ENTER', {
      state: this.locomotion,
      action: this.action,
      focus: this.focus,
      frameNo: this.frameNo,
    })
  }

  update(_dtMs: number, _ctx?: RuntimeContext): void {
    if (!this.ctx) {
      return
    }
    const now = Date.now()
    this.frameNo += 1

    if (this.action !== 'none' && this.actionExpireAt > 0 && this.frameNo >= this.actionExpireAt) {
      this.emitAnimationState('ANIM_STATE_EXIT', {
        state: 'action',
        action: this.action,
        frameNo: this.frameNo,
      })
      this.action = 'none'
      this.actionExpireAt = 0
      this.actionSource = null
    }

    if (this.reaction) {
      this.emitAnimationState('ANIM_STATE_EXIT', {
        state: 'react',
        frameNo: this.frameNo,
        detail: this.reaction,
      })
      this.reaction = null
    }

    if (this.emote && this.frameNo >= this.emoteExpireAt) {
      this.emitAnimationState('ANIM_STATE_EXIT', {
        state: 'emote',
        frameNo: this.frameNo,
        action: this.emote,
      })
      this.emote = null
      this.emoteExpireAt = 0
      this.action = 'none'
    }

    if (this.frameNo % 90 === 0) {
      this.ctx.bus.emit({
        ts: now,
        level: 'debug',
        event_code: 'ANIM_BLEND',
        payload: {
          locomotion: this.locomotion,
          action: this.action,
          focus: this.focus,
          frameNo: this.frameNo,
        },
      })
    }

    if (this.frameNo % 180 === 0) {
      this.setBlink(!this.blink)
    }
  }

  setLocomotion(speed: number, direction = 0): void {
    const next = this.speedToState(speed)
    if (next === this.locomotion) {
      return
    }
    const previous = this.locomotion
    this.locomotion = next
    this.emitAnimationState('ANIM_STATE_EXIT', {
      state: previous,
      next,
      direction,
      frameNo: this.frameNo,
    })
    this.emitAnimationState('ANIM_STATE_ENTER', {
      state: next,
      previous,
      direction,
      frameNo: this.frameNo,
    })
  }

  playAction(actionId: string, priority: number): void {
    if (priority <= 0) {
      return
    }

    if (this.action !== 'none' && this.actionExpireAt > this.frameNo) {
      return
    }

    const next = actionId.includes('cast') ? 'cast' : 'attack'
    this.action = next
    this.actionSource = actionId
    this.actionExpireAt = this.frameNo + (next === 'cast' ? 12 : 8)
    this.emitAnimationState('ANIM_STATE_ENTER', {
      state: next,
      source: actionId,
      duration: next === 'cast' ? 12 : 8,
      frameNo: this.frameNo,
    })
  }

  setHitReaction(type: string, intensity: number): void {
    this.reaction = `${type}:${intensity}`
    this.emitAnimationState('ANIM_STATE_ENTER', {
      state: 'react',
      reaction: this.reaction,
      frameNo: this.frameNo,
    })
    this.emitMorph()
  }

  setEmote(emoteId: string, durationMs = 500): void {
    this.emote = emoteId
    this.action = 'emote'
    this.emoteExpireAt = this.frameNo + Math.max(1, Math.floor(durationMs / 16))
    this.emitAnimationState('ANIM_STATE_ENTER', {
      state: 'emote',
      emote: emoteId,
      frameNo: this.frameNo,
      durationMs,
    })
  }

  setMorphWeights(channel: string, weights: number[]): void {
    this.morphWeights.set(channel, Number(weights[0] ?? 0))
  }

  setBlink(state = true): void {
    this.blink = state
    this.emitMorph()
  }

  getState(): {
    locomotion: LocomotionState
    action: ActionState
    focus: FocusState
  } {
    return {
      locomotion: this.locomotion,
      action: this.action,
      focus: this.focus,
    }
  }

  async dispose(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.ctx = null
    this.reset()
  }

  private emitMorph(): void {
    if (!this.ctx) {
      return
    }
    const weight = this.morphWeights.get('blink') ?? (this.blink ? 1 : 0)
    this.ctx.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'MORPH_APPLY',
      payload: {
        channel: 'blink',
        value: weight,
      },
    })
  }

  private emitAnimationState(eventCode: 'ANIM_STATE_ENTER' | 'ANIM_STATE_EXIT', payload: Record<string, unknown>): void {
    if (!this.ctx) {
      return
    }
    this.ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: eventCode,
      payload,
    })
  }

  private speedToState(speed: number): LocomotionState {
    if (speed < 0.08) {
      return 'idle'
    }
    if (speed <= 0.5) {
      return 'walk'
    }
    if (speed <= 1.05) {
      return 'run'
    }
    return 'jump'
  }

  private reset(): void {
    this.frameNo = 0
    this.locomotion = 'idle'
    this.action = 'none'
    this.actionExpireAt = 0
    this.actionSource = null
    this.reaction = null
    this.emote = null
    this.emoteExpireAt = 0
    this.focus = 'GameOnly'
    this.blink = true
    this.morphWeights.clear()
  }

  private asInputFrame(payload: unknown): InputFramePayload | null {
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
        y: Number((candidate.move as { y?: unknown }).y ?? 0),
        z: Number((candidate.move as { z?: unknown }).z ?? 0),
      },
      look: {
        yaw: Number((candidate.look as { yaw?: unknown }).yaw ?? 0),
        pitch: Number((candidate.look as { pitch?: unknown }).pitch ?? 0),
      },
      actions: Array.isArray(candidate.actions) ? (candidate.actions as string[]) : [],
    }
  }
}
