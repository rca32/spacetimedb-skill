import { BoxColliderShape, ColliderComponent, ComponentBase, Time, Vector3 } from '@orillusion/core'
import { Rigidbody } from '@orillusion/physics'

export interface MotionIntentSnapshot {
  readonly inputX: number
  readonly inputZ: number
  readonly requestedSpeed: number
  readonly jump: boolean
}

export class CharacterMotorComponent extends ComponentBase {
  public walkSpeed = 5.5
  public runSpeed = 8.5

  private readonly keys = new Set<string>()
  private rigidbody: Rigidbody | null = null
  private viewYawDegrees = 180

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code)
    this.keys.add(normalizeKey(event.key))
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
    this.keys.delete(normalizeKey(event.key))
  }

  private readonly onWindowBlur = () => {
    this.keys.clear()
  }

  public start(): void {
    const collider = this.object3D.getOrAddComponent(ColliderComponent)
    const shape = new BoxColliderShape()
    shape.size = new Vector3(0.7, 1.8, 0.7)
    collider.shape = shape

    try {
      this.rigidbody = this.object3D.getOrAddComponent(Rigidbody)
      this.rigidbody.mass = 1
      this.rigidbody.isKinematic = true
    } catch (error) {
      this.rigidbody = null
      console.warn('[stitch-orillusion-client] character motor running without rigidbody', error)
    }

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onWindowBlur)
  }

  public onUpdate(): void {
    const dtRaw = Time.delta * 0.001
    const dtSeconds = Number.isFinite(dtRaw) && dtRaw > 0 ? Math.min(dtRaw, 0.05) : 1 / 60
    const intent = this.readWorldIntentSnapshot()

    // Face the same heading as camera yaw (FPS/TPS-style coupling).
    this.object3D.rotationY = this.viewYawDegrees + 180

    if (intent.inputX === 0 && intent.inputZ === 0) {
      return
    }

    this.object3D.x += intent.inputX * intent.requestedSpeed * dtSeconds
    this.object3D.z += intent.inputZ * intent.requestedSpeed * dtSeconds

    this.rigidbody?.updateTransform(undefined, undefined, true)
  }

  public readIntentSnapshot(): MotionIntentSnapshot {
    // Local inputs: +X right (D), +Z forward (W).
    const inputX = (this.hasAny('KeyD', 'd', 'ArrowRight') ? 1 : 0)
      - (this.hasAny('KeyA', 'a', 'ArrowLeft') ? 1 : 0)
    const inputZ = (this.hasAny('KeyW', 'w', 'ArrowUp') ? 1 : 0)
      - (this.hasAny('KeyS', 's', 'ArrowDown') ? 1 : 0)

    const isRunning = this.hasAny('ShiftLeft', 'ShiftRight', 'Shift')
    const requestedSpeed = isRunning ? this.runSpeed : this.walkSpeed

    return {
      inputX,
      inputZ,
      requestedSpeed,
      jump: this.hasAny('Space', ' '),
    }
  }

  public readWorldIntentSnapshot(): MotionIntentSnapshot {
    const local = this.readIntentSnapshot()
    if (local.inputX === 0 && local.inputZ === 0) {
      return local
    }

    const yaw = (this.viewYawDegrees * Math.PI) / 180
    const forwardX = -Math.sin(yaw)
    const forwardZ = -Math.cos(yaw)
    const rightX = forwardZ
    const rightZ = -forwardX

    const worldX = rightX * local.inputX + forwardX * local.inputZ
    const worldZ = rightZ * local.inputX + forwardZ * local.inputZ

    return {
      inputX: worldX,
      inputZ: worldZ,
      requestedSpeed: local.requestedSpeed,
      jump: local.jump,
    }
  }

  public setViewYawDegrees(yawDegrees: number): void {
    this.viewYawDegrees = yawDegrees
  }

  public readPosition(): Vector3 {
    return this.object3D.transform.worldPosition
  }

  public snapToGround(y: number): void {
    if (!Number.isFinite(y)) {
      return
    }
    this.object3D.y = y
    this.rigidbody?.updateTransform(undefined, undefined, true)
  }

  public destroy(force?: boolean): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onWindowBlur)
    super.destroy(force)
  }

  private hasAny(...keys: string[]): boolean {
    for (const key of keys) {
      if (this.keys.has(key)) {
        return true
      }
    }
    return false
  }
}

function normalizeKey(raw: string): string {
  if (raw === ' ') {
    return raw
  }
  return raw.length === 1 ? raw.toLowerCase() : raw
}
