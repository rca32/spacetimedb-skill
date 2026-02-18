import { Camera3D, ComponentBase, Object3D, Vector3 } from '@orillusion/core'

export class CameraFollowComponent extends ComponentBase {
  public target: Object3D | null = null
  public yawDegrees = 180
  public pitchDegrees = 24
  public distance = 8
  public heightOffset = 1.7
  public lookAtHeight = 1.1

  private readonly up = new Vector3(0, 1, 0)
  private camera: Camera3D | null = null

  public start(): void {
    this.camera = this.object3D.getOrAddComponent(Camera3D)
  }

  public onUpdate(): void {
    if (!this.camera || !this.target) {
      return
    }

    const targetWorld = this.target.transform.worldPosition
    const yaw = (this.yawDegrees * Math.PI) / 180
    const pitch = (this.pitchDegrees * Math.PI) / 180

    const offsetX = Math.cos(pitch) * Math.sin(yaw) * this.distance
    const offsetY = Math.sin(pitch) * this.distance + this.heightOffset
    const offsetZ = Math.cos(pitch) * Math.cos(yaw) * this.distance

    const cameraPosition = new Vector3(targetWorld.x + offsetX, targetWorld.y + offsetY, targetWorld.z + offsetZ)
    const lookAtTarget = new Vector3(targetWorld.x, targetWorld.y + this.lookAtHeight, targetWorld.z)

    this.camera.lookAt(cameraPosition, lookAtTarget, this.up)
  }
}
