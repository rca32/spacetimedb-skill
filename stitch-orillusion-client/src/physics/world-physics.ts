import {
  BoxColliderShape,
  ColliderComponent,
  Object3D,
  Scene3D,
  Vector3,
} from '@orillusion/core'
import { Rigidbody } from '@orillusion/physics'

export function createPhysicsGround(scene: Scene3D): Object3D {
  const ground = new Object3D()

  const rigidbody = ground.addComponent(Rigidbody)
  rigidbody.mass = 0

  const collider = ground.addComponent(ColliderComponent)
  const shape = new BoxColliderShape()
  shape.size = new Vector3(600, 0.2, 600)
  collider.shape = shape

  scene.addChild(ground)
  return ground
}
