import { describe, expect, it } from 'bun:test'
import * as THREE from 'three'
import {
  ThirdPersonCameraController,
  type ThirdPersonCameraOptionsOverrides,
} from './third-person-camera'

function createController(overrides: ThirdPersonCameraOptionsOverrides = {}): ThirdPersonCameraController {
  return new ThirdPersonCameraController({
    followHeight: 0,
    minCameraHeightOffset: 0,
    modeBlendTime: 0,
    freeMode: {
      shoulderOffsetX: 0,
      shoulderOffsetY: 0,
      shoulderOffsetZ: 0,
      verticalArmLength: 0,
      cameraSide: 1,
      cameraDistance: 5,
      lookAheadDistance: 0,
      fovDeg: 70,
    },
    aimMode: {
      shoulderOffsetX: 0,
      shoulderOffsetY: 0,
      shoulderOffsetZ: 0,
      verticalArmLength: 0,
      cameraSide: 1,
      cameraDistance: 3,
      lookAheadDistance: 0,
      fovDeg: 55,
    },
    damping: {
      rigX: 0,
      rigY: 0,
      rigZ: 0,
      lookAt: 0,
    },
    collisions: {
      enabled: true,
      cameraRadius: 0.2,
      buffer: 0.1,
      minDistance: 1,
      minimumDistanceFromTarget: 0.3,
      distanceLimit: 0,
      layerMask: 0xffff_ffff,
      transparentLayerMask: 0,
      ignoreTags: [],
      dampingInto: 0,
      dampingFrom: 0,
      smoothingTime: 0,
      minimumOcclusionTime: 0,
      strategy: 'pull_forward',
      maximumEffort: 4,
      deocclusionDamping: 0,
      deocclusionDampingWhenOccluded: 0,
      deocclusionSmoothingTime: 0,
    },
    aim: {
      enabled: true,
      collisionLayerMask: 0xffff_ffff,
      ignoreTags: [],
      aimDistance: 200,
      noiseCancellation: true,
    },
    noise: {
      enabled: false,
      amplitudeGain: 0,
      frequencyGain: 1,
      position: { x: [], y: [], z: [] },
      orientation: { x: [], y: [], z: [] },
    },
    impulse: {
      enabled: false,
      defaultAmplitude: 1,
      defaultAttackTime: 0.02,
      defaultSustainTime: 0.08,
      defaultDecayTime: 0.24,
      defaultRadius: 0,
      defaultDissipationDistance: 50,
      defaultPropagationSpeed: 9999,
    },
    ...overrides,
  })
}

describe('ThirdPersonCameraController', () => {
  it('places camera behind target from yaw/pitch rig', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      collisions: {
        enabled: false,
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    expect(Math.abs(camera.position.x)).toBeLessThan(1e-6)
    expect(Math.abs(camera.position.y)).toBeLessThan(1e-6)
    expect(Math.abs(camera.position.z - 5)).toBeLessThan(1e-6)
  })

  it('responds to fast yaw changes without orbit lag', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      damping: {
        rigX: 9,
        rigY: 9,
        rigZ: 9,
        lookAt: 12,
      },
      collisions: {
        enabled: false,
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: Math.PI / 2,
      viewPitch: 0,
      bodyYaw: Math.PI / 2,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    expect(camera.position.x).toBeGreaterThan(4)
    expect(Math.abs(camera.position.z)).toBeLessThan(1.5)
  })

  it('keeps up with target translation even with high damping settings', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      damping: {
        rigX: 9,
        rigY: 9,
        rigZ: 9,
        lookAt: 12,
      },
      collisions: {
        enabled: false,
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: -1,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    expect(camera.position.z).toBeLessThan(4.6)
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
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    expect(camera.position.z).toBeLessThan(2)
    expect(camera.position.z).toBeGreaterThan(0.8)
  })

  it('never lets camera drop below configured minimum height', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      minCameraHeightOffset: 0.25,
      collisions: {
        enabled: false,
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: Math.PI / 3,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    expect(camera.position.y).toBeGreaterThan(0.249)
  })

  it('computes reference look-at and aim target in aim mode', () => {
    const scene = new THREE.Scene()
    const target = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshBasicMaterial())
    target.position.set(0, 0, -8)
    target.userData.cameraObstacle = true
    scene.add(target)
    scene.updateMatrixWorld(true)

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      modeBlendTime: 0,
      aimMode: {
        cameraDistance: 3,
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: true,
      dtSeconds: 1 / 60,
    })

    const snapshot = controller.getDebugSnapshot()
    expect(snapshot.mode).toBe('aim')
    expect(snapshot.referenceLookAt.z).toBeLessThan(-6.5)
    expect(snapshot.aimTarget.z).toBeLessThan(-6.5)
  })

  it('blends FOV toward aim profile when aim mode is enabled', () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      modeBlendTime: 0.2,
      freeMode: {
        fovDeg: 70,
      },
      aimMode: {
        fovDeg: 45,
      },
      collisions: {
        enabled: false,
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })
    const freeFov = camera.fov

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: true,
      dtSeconds: 0.2,
    })

    expect(camera.fov).toBeLessThan(freeFov)
  })

  it('ignores collision objects tagged in ignore list', () => {
    const scene = new THREE.Scene()
    const blocker = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial())
    blocker.position.set(0, 0, 2)
    blocker.userData.cameraObstacle = true
    blocker.userData.cameraTag = 'player'
    scene.add(blocker)
    scene.updateMatrixWorld(true)

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000)
    const controller = createController({
      collisions: {
        ignoreTags: ['player'],
      },
    })

    controller.update({
      camera,
      scene,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      viewYaw: 0,
      viewPitch: 0,
      bodyYaw: 0,
      aimMode: false,
      dtSeconds: 1 / 60,
    })

    expect(Math.abs(camera.position.z - 5)).toBeLessThan(0.25)
  })
})
