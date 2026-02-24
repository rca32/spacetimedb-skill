import { ComponentBase, Object3D } from '@engine/core'

export class CameraCollisionComponent extends ComponentBase {
  public target: Object3D | null = null
  public minHeightFromTarget = 0.35
  public maxDistance = 16

  public onBeforeUpdate(): void {
    if (!this.target) {
      return
    }

    const targetPos = this.target.transform.worldPosition
    let nextX = this.object3D.x
    let nextY = this.object3D.y
    let nextZ = this.object3D.z

    const minY = targetPos.y + this.minHeightFromTarget
    if (nextY < minY) {
      nextY = minY
    }

    let dx = nextX - targetPos.x
    let dy = nextY - targetPos.y
    let dz = nextZ - targetPos.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (distance <= this.maxDistance || distance <= Number.EPSILON) {
      this.object3D.x = nextX
      this.object3D.y = nextY
      this.object3D.z = nextZ
      return
    }

    const scale = this.maxDistance / distance
    dx *= scale
    dy *= scale
    dz *= scale
    this.object3D.x = targetPos.x + dx
    this.object3D.y = targetPos.y + dy
    this.object3D.z = targetPos.z + dz
  }
}
