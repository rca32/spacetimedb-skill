import {
  BoxGeometry,
  Color,
  LitMaterial,
  MeshRenderer,
  Object3D,
  Scene3D,
  SphereGeometry,
} from '@orillusion/core'

export interface WorldSceneObjects {
  readonly player: Object3D
}

export function seedWorldScene(scene: Scene3D): WorldSceneObjects {
  const player = createPlayer(scene)
  createLandmarks(scene)
  return { player }
}

function createPlayer(scene: Scene3D): Object3D {
  const player = new Object3D()
  const mesh = player.addComponent(MeshRenderer)
  mesh.geometry = new BoxGeometry(0.9, 1.8, 0.9)

  const material = new LitMaterial()
  material.baseColor = new Color(0.1, 0.65, 0.95, 1.0)
  material.roughness = 0.55
  material.metallic = 0.05
  mesh.material = material
  mesh.castShadow = true

  player.y = 1.0
  scene.addChild(player)
  return player
}

function createLandmarks(scene: Scene3D): void {
  const markerMaterial = new LitMaterial()
  markerMaterial.baseColor = new Color(0.88, 0.82, 0.38, 1.0)
  markerMaterial.roughness = 0.45
  markerMaterial.metallic = 0.02

  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12
    const radius = 18

    const marker = new Object3D()
    const mesh = marker.addComponent(MeshRenderer)
    mesh.geometry = new SphereGeometry(0.5, 20, 20)
    mesh.material = markerMaterial

    marker.x = Math.cos(angle) * radius
    marker.y = 0.5
    marker.z = Math.sin(angle) * radius
    scene.addChild(marker)
  }
}
