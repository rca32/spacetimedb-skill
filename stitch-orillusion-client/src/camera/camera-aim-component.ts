import { Camera3D, ComponentBase, Engine3D } from '@orillusion/core'
import { CameraFollowComponent } from './camera-follow-component'

export class CameraAimComponent extends ComponentBase {
  public normalFov = 70
  public aimFov = 58
  public blendPerSecond = 8
  public lookSensitivity = 0.12
  public zoomStep = 0.7
  public minDistance = 3
  public maxDistance = 20
  public minPitchDegrees = -20
  public maxPitchDegrees = 78

  private camera: Camera3D | null = null
  private follow: CameraFollowComponent | null = null
  private aiming = false
  private rotating = false
  private currentFov = this.normalFov
  private lastMouseX: number | null = null
  private lastMouseY: number | null = null
  private pointerLockCanvas: HTMLCanvasElement | null = null

  private readonly onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 && event.button !== 2) {
      return
    }

    if (event.button === 2) {
      this.aiming = true
      this.tryEnterPointerLock()
    }

    this.rotating = true
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private readonly onMouseUp = (event: MouseEvent) => {
    if (event.button !== 0 && event.button !== 2) {
      return
    }

    if (event.button === 2) {
      this.aiming = false
      this.tryExitPointerLock()
    }

    if ((event.buttons & 0b101) === 0) {
      this.rotating = false
      this.lastMouseX = null
      this.lastMouseY = null
    }
  }

  private readonly onMouseMove = (event: MouseEvent) => {
    if (!this.follow) {
      return
    }

    if (!this.rotating && !this.isPointerLocked()) {
      return
    }

    const delta = this.readMouseDelta(event)
    if (!delta) {
      return
    }

    this.follow.yawDegrees -= delta.x * this.lookSensitivity
    const nextPitch = this.follow.pitchDegrees - delta.y * this.lookSensitivity
    this.follow.pitchDegrees = clamp(nextPitch, this.minPitchDegrees, this.maxPitchDegrees)
  }

  private readonly onMouseWheel = (event: WheelEvent) => {
    if (!this.follow) {
      return
    }

    event.preventDefault()
    const zoomDirection = Math.sign(event.deltaY)
    if (zoomDirection === 0) {
      return
    }

    const targetDistance = this.follow.distance + zoomDirection * this.zoomStep
    this.follow.distance = clamp(targetDistance, this.minDistance, this.maxDistance)
  }

  private readonly onPointerLockChange = () => {
    if (this.isPointerLocked()) {
      return
    }

    this.rotating = false
    this.lastMouseX = null
    this.lastMouseY = null
  }

  private readonly onWindowBlur = () => {
    this.aiming = false
    this.rotating = false
    this.lastMouseX = null
    this.lastMouseY = null
    this.tryExitPointerLock()
  }

  public start(): void {
    this.camera = this.object3D.getOrAddComponent(Camera3D)
    this.follow = this.object3D.getComponent(CameraFollowComponent)
    this.currentFov = this.normalFov
    this.pointerLockCanvas = document.querySelector('canvas')

    window.addEventListener('contextmenu', preventDefault)
    window.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('wheel', this.onMouseWheel, { passive: false })
    window.addEventListener('blur', this.onWindowBlur)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  public onUpdate(): void {
    if (!this.camera) {
      return
    }

    const target = this.aiming ? this.aimFov : this.normalFov
    const step = this.blendPerSecond * (1 / 60)
    this.currentFov += (target - this.currentFov) * step
    this.camera.perspective(this.currentFov, Engine3D.aspect, 0.1, 3000)
  }

  public destroy(force?: boolean): void {
    window.removeEventListener('contextmenu', preventDefault)
    window.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('wheel', this.onMouseWheel)
    window.removeEventListener('blur', this.onWindowBlur)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    this.tryExitPointerLock()
    super.destroy(force)
  }

  private readMouseDelta(event: MouseEvent): { x: number; y: number } | null {
    let deltaX = event.movementX
    let deltaY = event.movementY

    if (!this.isPointerLocked() && deltaX === 0 && deltaY === 0) {
      if (this.lastMouseX === null || this.lastMouseY === null) {
        this.lastMouseX = event.clientX
        this.lastMouseY = event.clientY
        return null
      }

      deltaX = event.clientX - this.lastMouseX
      deltaY = event.clientY - this.lastMouseY
    }

    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    if (deltaX === 0 && deltaY === 0) {
      return null
    }

    return { x: deltaX, y: deltaY }
  }

  private isPointerLocked(): boolean {
    const canvas = this.pointerLockCanvas
    return Boolean(canvas) && document.pointerLockElement === canvas
  }

  private tryEnterPointerLock(): void {
    const canvas = this.pointerLockCanvas
    if (!canvas || this.isPointerLocked() || !canvas.requestPointerLock) {
      return
    }

    canvas.requestPointerLock()
  }

  private tryExitPointerLock(): void {
    if (!this.isPointerLocked() || !document.exitPointerLock) {
      return
    }

    document.exitPointerLock()
  }
}

function preventDefault(event: Event): void {
  event.preventDefault()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
