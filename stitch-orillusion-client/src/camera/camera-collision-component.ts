import { ComponentBase, Object3D } from '@engine/core'

export class CameraCollisionComponent extends ComponentBase {
  public target: Object3D | null = null
  public minHeightFromTarget = 0.35
  public maxDistance = 16

  public onUpdate(): void {
    if (!this.target) {
      return
    }

    const targetPos = this.target.transform.worldPosition
    const cameraPos = this.object3D.transform.worldPosition

    if (cameraPos.y < targetPos.y + this.minHeightFromTarget) {
      this.object3D.y = targetPos.y + this.minHeightFromTarget
    }

    const dx = cameraPos.x - targetPos.x
    const dy = cameraPos.y - targetPos.y
    const dz = cameraPos.z - targetPos.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (distance <= this.maxDistance || distance <= Number.EPSILON) {
      return
    }

    const scale = this.maxDistance / distance
    this.object3D.x = targetPos.x + dx * scale
    this.object3D.y = targetPos.y + dy * scale
    this.object3D.z = targetPos.z + dz * scale
  }
}
