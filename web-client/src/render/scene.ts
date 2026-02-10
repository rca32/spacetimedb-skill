import * as THREE from 'three'

export interface SceneBundle {
  scene: THREE.Scene
  ambient: THREE.AmbientLight
  directional: THREE.DirectionalLight
}

export function createSceneBundle(): SceneBundle {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a1119)

  const ambient = new THREE.AmbientLight(0xffffff, 0.45)
  const directional = new THREE.DirectionalLight(0xffffff, 1.15)
  directional.position.set(6, 10, 4)

  scene.add(ambient)
  scene.add(directional)

  return { scene, ambient, directional }
}
