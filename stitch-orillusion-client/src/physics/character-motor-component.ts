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

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code)
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
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
  }

  public onUpdate(): void {
    const dtRaw = Time.delta * 0.001
    const dtSeconds = Number.isFinite(dtRaw) && dtRaw > 0 ? Math.min(dtRaw, 0.05) : 1 / 60
    const intent = this.readIntentSnapshot()

    if (intent.inputX === 0 && intent.inputZ === 0) {
      return
    }

    this.object3D.x += intent.inputX * intent.requestedSpeed * dtSeconds
    this.object3D.z += intent.inputZ * intent.requestedSpeed * dtSeconds

    this.rigidbody?.updateTransform(undefined, undefined, true)
  }

  public readIntentSnapshot(): MotionIntentSnapshot {
    const inputX = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0)
      - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0)
    const inputZ = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0)
      - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0)

    const isRunning = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
    const requestedSpeed = isRunning ? this.runSpeed : this.walkSpeed

    return {
      inputX,
      inputZ,
      requestedSpeed,
      jump: this.keys.has('Space'),
    }
  }

  public readPosition(): Vector3 {
    return this.object3D.transform.worldPosition
  }

  public destroy(force?: boolean): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    super.destroy(force)
  }
}
