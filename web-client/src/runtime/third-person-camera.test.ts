import { describe, expect, it } from 'bun:test'
import * as THREE from 'three'
import { ThirdPersonCameraController } from './third-person-camera'

function createController(): ThirdPersonCameraController {
  return new ThirdPersonCameraController({
    followHeight: 0,
    shoulderOffsetX: 0,
    shoulderOffsetY: 0,
    shoulderOffsetZ: 0,
    verticalArmLength: 0,
    cameraSide: 1,
    cameraDistance: 5,
    minDistance: 1,
    lookAheadDistance: 0,
    positionDamping: 20,
    aimDamping: 20,
    collisionBuffer: 0.1,
    collisionDampingInto: 0,
    collisionDampingFrom: 0,
    collisionSmoothingTime: 0,
    pitchMinRad: -Math.PI / 3,
    pitchMaxRad: Math.PI / 3,
  })
}

describe('ThirdPersonCameraController', () => {
  it('places camera behind target from yaw/pitch rig', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController()

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      dtSeconds: 1 / 60,
    })

    expect(Math.abs(camera.position.x)).toBeLessThan(1e-6)
    expect(Math.abs(camera.position.y)).toBeLessThan(1e-6)
    expect(Math.abs(camera.position.z - 5)).toBeLessThan(1e-6)
  })

  it('pushes camera in front of obstacles along camera ray', () => {
    const scene = new THREE.Scene()
    const blocker = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    blocker.position.set(0, 0, 2)
    blocker.userData.cameraObstacle = true
    scene.add(blocker)
    scene.updateMatrixWorld(true)

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController()

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      dtSeconds: 1 / 60,
    })

    expect(camera.position.z).toBeLessThan(2)
    expect(camera.position.z).toBeGreaterThan(1)
  })
})
