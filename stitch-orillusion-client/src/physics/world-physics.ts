import {
  BoxColliderShape,
  ColliderComponent,
  Color,
  MeshRenderer,
  Object3D,
  PlaneGeometry,
  Scene3D,
  UnLitMaterial,
  Vector3,
} from '@orillusion/core'
import { Rigidbody } from '@orillusion/physics'

export function createPhysicsGround(scene: Scene3D): Object3D {
  const ground = new Object3D()
  const mesh = ground.addComponent(MeshRenderer)

  mesh.geometry = new PlaneGeometry(600, 600)

  const material = new UnLitMaterial()
  material.baseColor = new Color(0.22, 0.26, 0.32, 1.0)
  mesh.material = material

  const rigidbody = ground.addComponent(Rigidbody)
  rigidbody.mass = 0

  const collider = ground.addComponent(ColliderComponent)
  const shape = new BoxColliderShape()
  shape.size = new Vector3(600, 0.2, 600)
  collider.shape = shape

  scene.addChild(ground)
  return ground
}
