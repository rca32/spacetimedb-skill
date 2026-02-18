import { Camera3D, ComponentBase, Engine3D } from '@orillusion/core'

export class CameraAimComponent extends ComponentBase {
  public normalFov = 70
  public aimFov = 58
  public blendPerSecond = 8

  private camera: Camera3D | null = null
  private aiming = false
  private currentFov = this.normalFov

  private readonly onMouseDown = (event: MouseEvent) => {
    if (event.button === 2) {
      this.aiming = true
    }
  }

  private readonly onMouseUp = (event: MouseEvent) => {
    if (event.button === 2) {
      this.aiming = false
    }
  }

  public start(): void {
    this.camera = this.object3D.getOrAddComponent(Camera3D)
    this.currentFov = this.normalFov

    window.addEventListener('contextmenu', preventDefault)
    window.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup', this.onMouseUp)
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
    super.destroy(force)
  }
}

function preventDefault(event: Event): void {
  event.preventDefault()
}
