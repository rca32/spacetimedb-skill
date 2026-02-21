import { BoxColliderShape, ColliderComponent, ComponentBase, Time, Vector3 } from '@orillusion/core'
import { Rigidbody } from '@orillusion/physics'
import {
  solveKinematicTerrainStep,
  type KinematicTerrainState,
  type TerrainHeightSampler,
} from './kinematic-terrain-solver'

export interface MotionIntentSnapshot {
  readonly inputX: number
  readonly inputZ: number
  readonly requestedSpeed: number
  readonly jump: boolean
}

export class CharacterMotorComponent extends ComponentBase {
  // Tuned down to better match Soldier locomotion clips and reduce foot sliding.
  public walkSpeed = 3.2
  public runSpeed = 5.2

  private readonly keys = new Set<string>()
  private rigidbody: Rigidbody | null = null
  private viewYawDegrees = 180
  private terrainSampler: TerrainHeightSampler | null = null
  private kinematicState: KinematicTerrainState | null = null
  private groundOffset = 0.9

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return
    }

    if (isMovementKeyEvent(event)) {
      event.preventDefault()
    }

    this.keys.add(event.code)
    this.keys.add(normalizeKey(event.key))
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (isMovementKeyEvent(event)) {
      event.preventDefault()
    }

    this.keys.delete(event.code)
    this.keys.delete(normalizeKey(event.key))
  }

  private readonly onWindowBlur = () => {
    this.keys.clear()
  }

  private readonly onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      this.keys.clear()
    }
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

    document.addEventListener('keydown', this.onKeyDown, true)
    document.addEventListener('keyup', this.onKeyUp, true)
    window.addEventListener('blur', this.onWindowBlur)
    document.addEventListener('visibilitychange', this.onVisibilityChange)

    const pos = this.object3D.transform.worldPosition
    this.kinematicState = {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      velocityY: 0,
      grounded: false,
      groundOffset: this.groundOffset,
    }
  }

  public onUpdate(): void {
    const dtRaw = Time.delta * 0.001
    const dtSeconds = Number.isFinite(dtRaw) && dtRaw > 0 ? Math.min(dtRaw, 0.05) : 1 / 60
    const intent = this.readWorldIntentSnapshot()

    // Face the same heading as camera yaw (FPS/TPS-style coupling).
    this.object3D.rotationY = this.viewYawDegrees + 180
    const terrain = this.terrainSampler
    if (!terrain) {
      if (intent.inputX === 0 && intent.inputZ === 0) {
        return
      }

      this.object3D.x += intent.inputX * intent.requestedSpeed * dtSeconds
      this.object3D.z += intent.inputZ * intent.requestedSpeed * dtSeconds
      this.rigidbody?.updateTransform(undefined, undefined, true)
      return
    }

    const pos = this.object3D.transform.worldPosition
    const next = solveKinematicTerrainStep(
      {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        velocityY: this.kinematicState?.velocityY ?? 0,
        grounded: this.kinematicState?.grounded ?? false,
        groundOffset: this.kinematicState?.groundOffset ?? this.groundOffset,
      },
      {
        inputX: intent.inputX,
        inputZ: intent.inputZ,
        requestedSpeed: intent.requestedSpeed,
        jump: intent.jump,
        dtSeconds,
      },
      terrain,
    )

    this.kinematicState = next
    this.object3D.x = next.x
    this.object3D.y = next.y
    this.object3D.z = next.z
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
    // Y-up plane right vector = (-forward.z, forward.x)
    const rightX = -forwardZ
    const rightZ = forwardX

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

  public setTerrainSampler(terrainSampler: TerrainHeightSampler | null): void {
    this.terrainSampler = terrainSampler
  }

  public setGroundOffset(yOffset: number): void {
    if (!Number.isFinite(yOffset)) {
      return
    }
    this.groundOffset = yOffset
    const current = this.kinematicState
    if (!current) {
      return
    }
    this.kinematicState = {
      ...current,
      groundOffset: yOffset,
    }
  }

  public readPosition(): Vector3 {
    return this.object3D.transform.worldPosition
  }

  public snapToGround(y: number): void {
    if (!Number.isFinite(y)) {
      return
    }
    this.object3D.y = y
    if (this.kinematicState) {
      this.kinematicState = {
        ...this.kinematicState,
        y,
        velocityY: 0,
        grounded: true,
      }
    }
    this.rigidbody?.updateTransform(undefined, undefined, true)
  }

  public destroy(force?: boolean): void {
    document.removeEventListener('keydown', this.onKeyDown, true)
    document.removeEventListener('keyup', this.onKeyUp, true)
    window.removeEventListener('blur', this.onWindowBlur)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
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

function isMovementKeyEvent(event: KeyboardEvent): boolean {
  switch (event.code) {
    case 'KeyW':
    case 'KeyA':
    case 'KeyS':
    case 'KeyD':
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ShiftLeft':
    case 'ShiftRight':
    case 'Space':
      return true
    default:
      break
  }

  const key = normalizeKey(event.key)
  return (
    key === 'w' ||
    key === 'a' ||
    key === 's' ||
    key === 'd' ||
    key === 'arrowup' ||
    key === 'arrowdown' ||
    key === 'arrowleft' ||
    key === 'arrowright' ||
    key === 'shift' ||
    key === ' '
  )
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return target.closest('input, textarea, select, [contenteditable], [role="textbox"]') !== null
}
