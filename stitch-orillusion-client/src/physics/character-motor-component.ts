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
    this.keys.add(event.key.toLowerCase())
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase())
  }

  public start(): void {
    const collider = this.object3D.getOrAddComponent(ColliderComponent)
    const shape = new BoxColliderShape()
    shape.size = new Vector3(0.7, 1.8, 0.7)
    collider.shape = shape

    this.rigidbody = this.object3D.getOrAddComponent(Rigidbody)
    this.rigidbody.mass = 1
    this.rigidbody.isKinematic = true

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  public onUpdate(): void {
    const dtSeconds = Math.min(Time.delta * 0.001, 0.05)
    const intent = this.readIntentSnapshot()

    if (intent.inputX === 0 && intent.inputZ === 0) {
      return
    }

    this.object3D.x += intent.inputX * intent.requestedSpeed * dtSeconds
    this.object3D.z += intent.inputZ * intent.requestedSpeed * dtSeconds

    this.rigidbody?.updateTransform(undefined, undefined, true)
  }

  public readIntentSnapshot(): MotionIntentSnapshot {
    const inputX = (this.keys.has('d') ? 1 : 0) - (this.keys.has('a') ? 1 : 0)
    const inputZ = (this.keys.has('s') ? 1 : 0) - (this.keys.has('w') ? 1 : 0)

    const isRunning = this.keys.has('shift')
    const requestedSpeed = isRunning ? this.runSpeed : this.walkSpeed

    return {
      inputX,
      inputZ,
      requestedSpeed,
      jump: this.keys.has(' '),
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
