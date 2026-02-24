import type { RuntimeContext, DomainRuntime } from '../core/types'

type LocomotionState = 'idle' | 'walk' | 'run' | 'jump'
type ActionState = 'none' | 'attack' | 'cast' | 'react' | 'emote'

export class AnimationRuntime implements DomainRuntime {
  name = 'AnimationRuntime'
  private locomotion: LocomotionState = 'idle'
  private action: ActionState = 'none'
  private reaction: string | null = null
  private emote: string | null = null
  private blink = false
  private morphWeights = new Map<string, number>()
  private frameNo = 0

  async init(ctx: RuntimeContext): Promise<void> {
    this.locomotion = 'idle'
    this.action = 'none'
    this.frameNo = 0
    this.morphWeights.clear()
    this.blink = true
    ctx.logger.debug('[animation] reset')
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'ANIM_STATE_ENTER',
      payload: { state: this.locomotion },
    })
  }

  update(dtMs: number, _ctx: RuntimeContext): void {
    this.frameNo += 1
    if (this.action !== 'none' && this.frameNo % 120 === 0) {
      this.action = 'none'
      _ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'ANIM_STATE_EXIT',
        payload: { state: 'action', frameNo: this.frameNo },
      })
    }
    if (this.frameNo % 300 === 0) {
      _ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'MORPH_APPLY',
        payload: { channel: 'blink', value: this.blink },
      })
    }

    if (dtMs > 0 && this.locomotion === 'walk') {
      // intentionally deterministic micro-step for deterministic capture output
      this.blink = this.frameNo % 90 === 0
    }
  }

  setLocomotion(speed: number, direction = 0): void {
    if (Math.abs(speed) < 0.01) {
      this.locomotion = 'idle'
      return
    }
    if (Math.abs(speed) >= 0.9) {
      this.locomotion = 'run'
      return
    }
    this.locomotion = direction > 0.2 ? 'walk' : 'jump'
  }

  playAction(actionId: string, priority: number): void {
    if (actionId && priority > 0) {
      this.action = 'attack'
    } else {
      this.action = 'cast'
    }
  }

  setHitReaction(type: string, intensity: number): void {
    this.reaction = `${type}:${intensity}`
  }

  setEmote(emoteId: string, durationMs = 500): void {
    this.emote = `${emoteId}:${durationMs}`
    this.action = 'emote'
  }

  setMorphWeights(channel: string, weights: number[]): void {
    this.morphWeights.set(channel, weights[0] ?? 0)
  }

  setBlink(state = true): void {
    this.blink = state
  }

  getState(): {
    locomotion: LocomotionState
    action: ActionState
  } {
    return {
      locomotion: this.locomotion,
      action: this.action,
    }
  }

  async dispose(): Promise<void> {
    this.locomotion = 'idle'
    this.action = 'none'
    this.reaction = null
    this.emote = null
    this.frameNo = 0
  }
}
