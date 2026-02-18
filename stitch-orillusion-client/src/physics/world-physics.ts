import {
  BoxColliderShape,
  ColliderComponent,
  Color,
  LitMaterial,
  MeshRenderer,
  Object3D,
  PlaneGeometry,
  Scene3D,
  Vector3,
} from '@orillusion/core'
import { Rigidbody } from '@orillusion/physics'

export function createPhysicsGround(scene: Scene3D): Object3D {
  const ground = new Object3D()
  const mesh = ground.addComponent(MeshRenderer)

  mesh.geometry = new PlaneGeometry(600, 600)

  const material = new LitMaterial()
  material.baseColor = new Color(0.22, 0.26, 0.32, 1.0)
  material.roughness = 0.95
  material.metallic = 0.01
  mesh.material = material
  mesh.receiveShadow = true

  const rigidbody = ground.addComponent(Rigidbody)
  rigidbody.mass = 0

  const collider = ground.addComponent(ColliderComponent)
  const shape = new BoxColliderShape()
  shape.size = new Vector3(600, 0.2, 600)
  collider.shape = shape

  scene.addChild(ground)
  return ground
}
