import { AnimatorComponent, ComponentBase } from '@engine/core'
import { CharacterMotorComponent, type MotionIntentSnapshot } from '../physics/character-motor-component'

const INPUT_EPSILON = 0.001

type MoveDirection = 'idle' | 'forward' | 'backward' | 'left' | 'right'

interface LocomotionState {
  readonly direction: MoveDirection
  readonly running: boolean
}

interface LocomotionClipSet {
  readonly idle: string | null
  readonly walk: string | null
  readonly run: string | null
  readonly left: string | null
  readonly right: string | null
  readonly leftWalk: string | null
  readonly rightWalk: string | null
  readonly leftRun: string | null
  readonly rightRun: string | null
  readonly back: string | null
  readonly backWalk: string | null
  readonly backRun: string | null
  readonly fallback: string | null
}

const IDLE_INTENT: MotionIntentSnapshot = {
  inputX: 0,
  inputZ: 0,
  requestedSpeed: 0,
  jump: false,
}

export class PlayerLocomotionAnimationComponent extends ComponentBase {
  public motor: CharacterMotorComponent | null = null
  public crossFadeSeconds = 0.18

  private animator: AnimatorComponent | null = null
  private clips: LocomotionClipSet | null = null
  private clipSignature = ''
  private activeClipName: string | null = null
  private stateKey = ''

  public onUpdate(): void {
    const animator = this.resolveAnimator()
    if (!animator) {
      return
    }

    this.resolveMotor()
    const intent = this.motor?.readIntentSnapshot() ?? IDLE_INTENT
    const state = this.buildState(intent)
    const clipName = this.selectClipName(state)
    if (!clipName) {
      return
    }

    const nextStateKey = `${state.direction}:${state.running ? 'run' : 'walk'}:${clipName}`
    if (nextStateKey === this.stateKey && clipName === this.activeClipName) {
      return
    }

    this.playClip(animator, clipName)
    this.stateKey = nextStateKey
  }

  private resolveMotor(): void {
    if (this.motor) {
      return
    }
    const attached = this.object3D.getComponent(CharacterMotorComponent)
    if (attached) {
      this.motor = attached
    }
  }

  private resolveAnimator(): AnimatorComponent | null {
    if (this.animator && this.animator.clips && this.animator.clips.length > 0) {
      this.ensureClipSet(this.animator)
      return this.animator
    }

    const resolved = this.object3D.getComponentsInChild(AnimatorComponent)[0] ?? null
    if (!resolved || !resolved.clips || resolved.clips.length === 0) {
      return null
    }

    this.animator = resolved
    this.activeClipName = null
    this.stateKey = ''
    this.ensureClipSet(resolved)
    return resolved
  }

  private ensureClipSet(animator: AnimatorComponent): void {
    const signature = animator.clips.map((clip) => normalizeClipName(clip.clipName)).join('|')
    if (signature === this.clipSignature && this.clips) {
      return
    }

    this.clipSignature = signature
    this.clips = buildClipSet(animator)
    this.activeClipName = null
    this.stateKey = ''
  }

  private buildState(intent: MotionIntentSnapshot): LocomotionState {
    const absX = Math.abs(intent.inputX)
    const absZ = Math.abs(intent.inputZ)
    if (absX <= INPUT_EPSILON && absZ <= INPUT_EPSILON) {
      return { direction: 'idle', running: false }
    }

    const running = this.isRunning(intent)
    if (absX > absZ) {
      return { direction: intent.inputX < 0 ? 'left' : 'right', running }
    }
    return { direction: intent.inputZ < 0 ? 'backward' : 'forward', running }
  }

  private isRunning(intent: MotionIntentSnapshot): boolean {
    if (!this.motor) {
      return intent.requestedSpeed >= 7
    }
    const threshold = (this.motor.walkSpeed + this.motor.runSpeed) * 0.5
    return intent.requestedSpeed >= threshold
  }

  private selectClipName(state: LocomotionState): string | null {
    const clips = this.clips
    if (!clips) {
      return null
    }

    const forwardMove = state.running ? clips.run ?? clips.walk : clips.walk ?? clips.run
    switch (state.direction) {
      case 'idle':
        return clips.idle ?? forwardMove ?? clips.fallback
      case 'left':
        return state.running
          ? clips.leftRun ?? clips.leftWalk ?? clips.left ?? forwardMove ?? clips.fallback
          : clips.leftWalk ?? clips.leftRun ?? clips.left ?? forwardMove ?? clips.fallback
      case 'right':
        return state.running
          ? clips.rightRun ?? clips.rightWalk ?? clips.right ?? forwardMove ?? clips.fallback
          : clips.rightWalk ?? clips.rightRun ?? clips.right ?? forwardMove ?? clips.fallback
      case 'backward':
        return state.running
          ? clips.backRun ?? clips.backWalk ?? clips.back ?? forwardMove ?? clips.fallback
          : clips.backWalk ?? clips.backRun ?? clips.back ?? forwardMove ?? clips.fallback
      case 'forward':
      default:
        return forwardMove ?? clips.fallback
    }
  }

  private playClip(animator: AnimatorComponent, clipName: string): void {
    if (this.activeClipName === clipName) {
      return
    }

    const shouldCrossFade = this.activeClipName !== null && this.crossFadeSeconds > 0
    try {
      if (shouldCrossFade) {
        animator.crossFade(clipName, this.crossFadeSeconds)
      } else {
        animator.playAnim(clipName)
      }
      this.activeClipName = clipName
    } catch (error) {
      console.warn('[stitch-orillusion-client] failed to switch locomotion animation', {
        clipName,
        error,
      })
    }
  }
}

function buildClipSet(animator: AnimatorComponent): LocomotionClipSet {
  const fallback = animator.clips[0]?.clipName ?? null
  const run = findClipName(animator, ['run', 'jog', 'sprint'])
  const walk = findClipName(animator, ['walk', 'locomotion', 'move'])
  const idle = findClipName(animator, ['idle', 'stand', 'breath']) ?? walk ?? run ?? fallback

  const leftRun = findClipName(animator, ['strafe left run', 'run left', 'left run', 'runleft'])
  const rightRun = findClipName(animator, ['strafe right run', 'run right', 'right run', 'runright'])
  const leftWalk = findClipName(animator, ['strafe left walk', 'walk left', 'left walk', 'walkleft', 'strafe left'])
  const rightWalk = findClipName(animator, ['strafe right walk', 'walk right', 'right walk', 'walkright', 'strafe right'])
  const left = findClipName(animator, ['turn left', 'sidestep left', 'left'])
  const right = findClipName(animator, ['turn right', 'sidestep right', 'right'])

  const backRun = findClipName(animator, ['run back', 'run backward', 'backward run', 'runback'])
  const backWalk = findClipName(animator, ['walk back', 'walk backward', 'backward walk', 'walkback'])
  const back = findClipName(animator, ['backward', 'back', 'reverse'])

  return {
    idle,
    walk,
    run,
    left,
    right,
    leftWalk,
    rightWalk,
    leftRun,
    rightRun,
    back,
    backWalk,
    backRun,
    fallback,
  }
}

function findClipName(animator: AnimatorComponent, keywords: readonly string[]): string | null {
  let partial: string | null = null
  for (const clip of animator.clips) {
    const clipNorm = normalizeClipName(clip.clipName)
    const clipCompact = compactToken(clipNorm)
    for (const keyword of keywords) {
      const keywordNorm = normalizeClipName(keyword)
      const keywordCompact = compactToken(keywordNorm)
      if (clipNorm === keywordNorm || clipCompact === keywordCompact) {
        return clip.clipName
      }
      if (!partial && (clipNorm.includes(keywordNorm) || clipCompact.includes(keywordCompact))) {
        partial = clip.clipName
      }
    }
  }
  return partial
}

function normalizeClipName(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function compactToken(value: string): string {
  return value.replace(/[^a-z0-9]+/g, '')
}
