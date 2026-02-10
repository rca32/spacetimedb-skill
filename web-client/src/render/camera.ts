import * as THREE from 'three'

export function createPerspectiveCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000)
  camera.position.set(0, 2.0, 5.5)
  return camera
}

export function resizeCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
