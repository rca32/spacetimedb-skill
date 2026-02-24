import { Camera3D, ComponentBase, Object3D, Time, Vector3 } from '@engine/core'

export class CameraFollowComponent extends ComponentBase {
  public target: Object3D | null = null
  public yawDegrees = 180
  public pitchDegrees = 24
  public distance = 8
  public heightOffset = 1.7
  public lookAtHeight = 1.1
  public verticalFollowLerpPerSecond = 12

  private readonly up = new Vector3(0, 1, 0)
  private camera: Camera3D | null = null
  private smoothedTargetY: number | null = null

  public start(): void {
    this.camera = this.object3D.getOrAddComponent(Camera3D)
  }

  public onBeforeUpdate(): void {
    this.syncNow()
  }

  public syncNow(): void {
    if (!this.camera || !this.target) {
      this.smoothedTargetY = null
      return
    }

    const targetWorld = this.target.transform.worldPosition
    const targetY = this.sampleSmoothedTargetY(targetWorld.y)

    const yaw = (this.yawDegrees * Math.PI) / 180
    const pitch = (this.pitchDegrees * Math.PI) / 180

    const offsetX = Math.cos(pitch) * Math.sin(yaw) * this.distance
    const offsetY = Math.sin(pitch) * this.distance + this.heightOffset
    const offsetZ = Math.cos(pitch) * Math.cos(yaw) * this.distance

    const cameraPosition = new Vector3(targetWorld.x + offsetX, targetY + offsetY, targetWorld.z + offsetZ)
    const lookAtTarget = new Vector3(targetWorld.x, targetY + this.lookAtHeight, targetWorld.z)

    this.camera.lookAt(cameraPosition, lookAtTarget, this.up)
  }

  private sampleSmoothedTargetY(rawY: number): number {
    if (!Number.isFinite(rawY)) {
      return this.smoothedTargetY ?? 0
    }

    const current = this.smoothedTargetY
    if (current === null || Math.abs(rawY - current) > 3) {
      this.smoothedTargetY = rawY
      return rawY
    }

    const dtRaw = Time.delta * 0.001
    const dt = Number.isFinite(dtRaw) && dtRaw > 0 ? Math.min(dtRaw, 0.05) : 1 / 60
    const alpha = Math.min(1, Math.max(0, this.verticalFollowLerpPerSecond * dt))
    const next = current + (rawY - current) * alpha
    this.smoothedTargetY = next
    return next
  }
}
