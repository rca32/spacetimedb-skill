import * as THREE from 'three'

export type CameraOcclusionStrategy = 'pull_forward' | 'preserve_height' | 'preserve_distance'

export interface CameraModeProfile {
  shoulderOffsetX: number
  shoulderOffsetY: number
  shoulderOffsetZ: number
  verticalArmLength: number
  cameraSide: number
  cameraDistance: number
  lookAheadDistance: number
  fovDeg: number
}

export interface ThirdPersonCameraDampingSettings {
  rigX: number
  rigY: number
  rigZ: number
  lookAt: number
}

export interface ThirdPersonCameraCollisionSettings {
  enabled: boolean
  cameraRadius: number
  buffer: number
  minDistance: number
  minimumDistanceFromTarget: number
  distanceLimit: number
  layerMask: number
  transparentLayerMask: number
  ignoreTags: string[]
  dampingInto: number
  dampingFrom: number
  smoothingTime: number
  minimumOcclusionTime: number
  strategy: CameraOcclusionStrategy
  maximumEffort: number
  deocclusionDamping: number
  deocclusionDampingWhenOccluded: number
  deocclusionSmoothingTime: number
}

export interface ThirdPersonAimSettings {
  enabled: boolean
  collisionLayerMask: number
  ignoreTags: string[]
  aimDistance: number
  noiseCancellation: boolean
}

export interface CameraNoiseChannel {
  frequency: number
  amplitude: number
  constant?: boolean
}

export interface CameraNoiseAxisChannels {
  x: CameraNoiseChannel[]
  y: CameraNoiseChannel[]
  z: CameraNoiseChannel[]
}

export interface ThirdPersonNoiseSettings {
  enabled: boolean
  amplitudeGain: number
  frequencyGain: number
  position: CameraNoiseAxisChannels
  orientation: CameraNoiseAxisChannels
}

export interface ThirdPersonImpulseSettings {
  enabled: boolean
  defaultAmplitude: number
  defaultAttackTime: number
  defaultSustainTime: number
  defaultDecayTime: number
  defaultRadius: number
  defaultDissipationDistance: number
  defaultPropagationSpeed: number
}

export interface ThirdPersonCameraOptions {
  followHeight: number
  minCameraHeightOffset: number
  pitchMinRad: number
  pitchMaxRad: number
  modeBlendTime: number
  freeMode: CameraModeProfile
  aimMode: CameraModeProfile
  damping: ThirdPersonCameraDampingSettings
  collisions: ThirdPersonCameraCollisionSettings
  aim: ThirdPersonAimSettings
  noise: ThirdPersonNoiseSettings
  impulse: ThirdPersonImpulseSettings
}

export type ThirdPersonCameraOptionsOverrides =
  Partial<
    Omit<
      ThirdPersonCameraOptions,
      'freeMode' | 'aimMode' | 'damping' | 'collisions' | 'aim' | 'noise' | 'impulse'
    >
  > & {
    freeMode?: Partial<CameraModeProfile>
    aimMode?: Partial<CameraModeProfile>
    damping?: Partial<ThirdPersonCameraDampingSettings>
    collisions?: Partial<ThirdPersonCameraCollisionSettings>
    aim?: Partial<ThirdPersonAimSettings>
    noise?: Partial<ThirdPersonNoiseSettings>
    impulse?: Partial<ThirdPersonImpulseSettings>
  }

export interface ThirdPersonCameraUpdateInput {
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  targetX: number
  targetY: number
  targetZ: number
  viewYaw: number
  viewPitch: number
  bodyYaw?: number
  aimMode?: boolean
  dtSeconds: number
}

export interface ThirdPersonCameraDebugSnapshot {
  mode: 'free' | 'aim'
  modeBlend: number
  referenceLookAt: { x: number; y: number; z: number }
  aimTarget: { x: number; y: number; z: number }
  cameraCollisionCorrection: number
  occlusionDisplacement: number
}

export interface CameraImpulseEventInput {
  amplitude?: number
  attackTime?: number
  sustainTime?: number
  decayTime?: number
  position?: THREE.Vector3Like
  rotationDegrees?: THREE.Vector3Like
  source?: THREE.Vector3Like
  radius?: number
  dissipationDistance?: number
  propagationSpeed?: number
}

interface CameraImpulseEvent {
  startTime: number
  amplitude: number
  attackTime: number
  sustainTime: number
  decayTime: number
  position: THREE.Vector3
  rotationRad: THREE.Vector3
  source: THREE.Vector3
  radius: number
  dissipationDistance: number
  propagationSpeed: number
}

const EPS = 1e-5
const PRECISION_SLUSH = 1e-3
const WORLD_UP = new THREE.Vector3(0, 1, 0)
const LOCAL_FORWARD = new THREE.Vector3(0, 0, -1)
const LOCAL_UP = new THREE.Vector3(0, 1, 0)
const SPHERE_CAST_SAMPLES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.70710678, 0.70710678],
  [-0.70710678, 0.70710678],
  [0.70710678, -0.70710678],
  [-0.70710678, -0.70710678],
]

export class ThirdPersonCameraController {
  private readonly options: ThirdPersonCameraOptions

  private readonly root = new THREE.Vector3()
  private readonly playerOrigin = new THREE.Vector3()
  private readonly previousTargetPosition = new THREE.Vector3()
  private readonly dampingCorrectionLocal = new THREE.Vector3()
  private readonly movementDeltaLocal = new THREE.Vector3()

  private readonly headingQuat = new THREE.Quaternion()
  private readonly inverseHeadingQuat = new THREE.Quaternion()
  private readonly targetQuat = new THREE.Quaternion()
  private readonly targetEuler = new THREE.Euler(0, 0, 0, 'YXZ')
  private readonly targetForward = new THREE.Vector3()
  private readonly bodyForward = new THREE.Vector3()

  private readonly blendedMode: CameraModeProfile = {
    shoulderOffsetX: 0,
    shoulderOffsetY: 0,
    shoulderOffsetZ: 0,
    verticalArmLength: 0,
    cameraSide: 1,
    cameraDistance: 5,
    lookAheadDistance: 0,
    fovDeg: 70,
  }

  private readonly desiredShoulder = new THREE.Vector3()
  private readonly desiredHand = new THREE.Vector3()
  private readonly desiredCamera = new THREE.Vector3()
  private readonly desiredLookAt = new THREE.Vector3()

  private readonly smoothedCamera = new THREE.Vector3()
  private readonly smoothedLookAt = new THREE.Vector3()

  private readonly finalCamera = new THREE.Vector3()
  private readonly finalLookAt = new THREE.Vector3()
  private readonly finalForward = new THREE.Vector3()

  private readonly referenceLookAt = new THREE.Vector3()
  private readonly aimTarget = new THREE.Vector3()

  private readonly raycaster = new THREE.Raycaster()
  private readonly rayHits: THREE.Intersection<THREE.Object3D>[] = []

  private readonly rayOrigin = new THREE.Vector3()
  private readonly rayDirection = new THREE.Vector3()
  private readonly rayRight = new THREE.Vector3()
  private readonly rayUp = new THREE.Vector3()

  private readonly candidateQuat = new THREE.Quaternion()
  private readonly candidateA = new THREE.Vector3()
  private readonly candidateB = new THREE.Vector3()
  private readonly candidateDir = new THREE.Vector3()

  private readonly noisePosition = new THREE.Vector3()
  private readonly noiseOrientationRad = new THREE.Vector3()
  private readonly noisePositionOffsets = new THREE.Vector3()
  private readonly noiseOrientationOffsets = new THREE.Vector3()

  private readonly impulsePosition = new THREE.Vector3()
  private readonly impulseRotationRad = new THREE.Vector3()
  private readonly impulseEvents: CameraImpulseEvent[] = []

  private readonly tmpA = new THREE.Vector3()
  private readonly tmpB = new THREE.Vector3()
  private readonly tmpC = new THREE.Vector3()
  private readonly tmpEuler = new THREE.Euler(0, 0, 0, 'XYZ')
  private readonly tmpQuat = new THREE.Quaternion()

  private collisionCorrection = 0
  private collisionSmoothingHoldSeconds = 0
  private collisionSmoothingHoldCorrection = 0

  private readonly desiredOcclusionDisplacement = new THREE.Vector3()
  private readonly deocclusionDisplacement = new THREE.Vector3()
  private occlusionStartTime = -1
  private smoothedOcclusionDistance = 0
  private smoothedOcclusionStartTime = 0

  private initialized = false
  private modeBlend = 0
  private timeSeconds = 0

  constructor(options: ThirdPersonCameraOptionsOverrides = {}) {
    this.options = mergeCameraOptions(loadCameraOptions(), options)
    this.noisePositionOffsets.set(
      Math.random() * 1000,
      Math.random() * 1000,
      Math.random() * 1000,
    )
    this.noiseOrientationOffsets.set(
      Math.random() * 1000,
      Math.random() * 1000,
      Math.random() * 1000,
    )
  }

  reset(): void {
    this.initialized = false
    this.modeBlend = 0
    this.timeSeconds = 0

    this.dampingCorrectionLocal.set(0, 0, 0)
    this.collisionCorrection = 0
    this.collisionSmoothingHoldSeconds = 0
    this.collisionSmoothingHoldCorrection = 0

    this.desiredOcclusionDisplacement.set(0, 0, 0)
    this.deocclusionDisplacement.set(0, 0, 0)
    this.occlusionStartTime = -1
    this.smoothedOcclusionDistance = 0
    this.smoothedOcclusionStartTime = 0

    this.referenceLookAt.set(0, 0, 0)
    this.aimTarget.set(0, 0, 0)

    this.impulseEvents.length = 0
  }

  emitImpulse(input: CameraImpulseEventInput = {}): void {
    if (!this.options.impulse.enabled) {
      return
    }

    const amplitude = Math.max(0, input.amplitude ?? this.options.impulse.defaultAmplitude)
    const attackTime = Math.max(0, input.attackTime ?? this.options.impulse.defaultAttackTime)
    const sustainTime = Math.max(0, input.sustainTime ?? this.options.impulse.defaultSustainTime)
    const decayTime = Math.max(0, input.decayTime ?? this.options.impulse.defaultDecayTime)
    const radius = Math.max(0, input.radius ?? this.options.impulse.defaultRadius)
    const dissipationDistance = Math.max(
      0,
      input.dissipationDistance ?? this.options.impulse.defaultDissipationDistance,
    )
    const propagationSpeed = Math.max(1, input.propagationSpeed ?? this.options.impulse.defaultPropagationSpeed)

    const position = new THREE.Vector3(
      input.position?.x ?? 0,
      input.position?.y ?? 0,
      input.position?.z ?? 0,
    )
    const rotationDegrees = new THREE.Vector3(
      input.rotationDegrees?.x ?? 0,
      input.rotationDegrees?.y ?? 0,
      input.rotationDegrees?.z ?? 0,
    )
    const source = new THREE.Vector3(
      input.source?.x ?? this.root.x,
      input.source?.y ?? this.root.y,
      input.source?.z ?? this.root.z,
    )

    this.impulseEvents.push({
      startTime: this.timeSeconds,
      amplitude,
      attackTime,
      sustainTime,
      decayTime,
      position,
      rotationRad: rotationDegrees.multiplyScalar(Math.PI / 180),
      source,
      radius,
      dissipationDistance,
      propagationSpeed,
    })

    if (this.impulseEvents.length > 64) {
      this.impulseEvents.splice(0, this.impulseEvents.length - 64)
    }
  }

  getDebugSnapshot(): ThirdPersonCameraDebugSnapshot {
    return {
      mode: this.modeBlend >= 0.5 ? 'aim' : 'free',
      modeBlend: this.modeBlend,
      referenceLookAt: {
        x: this.referenceLookAt.x,
        y: this.referenceLookAt.y,
        z: this.referenceLookAt.z,
      },
      aimTarget: {
        x: this.aimTarget.x,
        y: this.aimTarget.y,
        z: this.aimTarget.z,
      },
      cameraCollisionCorrection: this.collisionCorrection,
      occlusionDisplacement: this.deocclusionDisplacement.length(),
    }
  }

  update(input: ThirdPersonCameraUpdateInput): void {
    const dtSeconds = Math.max(0, input.dtSeconds)
    if (dtSeconds > 0) {
      this.timeSeconds += dtSeconds
    }

    const yaw = normalizeAngle(numberOrDefault(input.viewYaw, 0))
    const pitch = clamp(
      numberOrDefault(input.viewPitch, 0),
      this.options.pitchMinRad,
      this.options.pitchMaxRad,
    )
    const bodyYaw = normalizeAngle(numberOrDefault(input.bodyYaw, yaw))
    const aimActive = Boolean(input.aimMode) && this.options.aim.enabled

    this.modeBlend = dampTowardValue(
      this.modeBlend,
      aimActive ? 1 : 0,
      this.options.modeBlendTime,
      dtSeconds,
    )

    blendModeProfile(this.options.freeMode, this.options.aimMode, this.modeBlend, this.blendedMode)

    this.playerOrigin.set(input.targetX, input.targetY, input.targetZ)
    this.root.set(input.targetX, input.targetY + this.options.followHeight, input.targetZ)

    this.headingQuat.setFromAxisAngle(WORLD_UP, yaw)
    this.inverseHeadingQuat.copy(this.headingQuat).invert()
    this.targetEuler.set(pitch, yaw, 0, 'YXZ')
    this.targetQuat.setFromEuler(this.targetEuler)
    this.targetForward.copy(LOCAL_FORWARD).applyQuaternion(this.targetQuat).normalize()
    this.bodyForward.copy(LOCAL_FORWARD).applyAxisAngle(WORLD_UP, bodyYaw).normalize()

    this.updateRigDampingCorrection(dtSeconds)
    this.computeRigPositions()

    const desiredDistance = Math.max(
      this.options.collisions.minDistance,
      this.blendedMode.cameraDistance - this.dampingCorrectionLocal.z,
    )

    this.desiredCamera.copy(this.desiredHand).addScaledVector(this.targetForward, -desiredDistance)
    this.desiredLookAt.copy(this.desiredHand).addScaledVector(this.targetForward, this.blendedMode.lookAheadDistance)

    this.applyCollisionResolution(input.scene, desiredDistance, dtSeconds)
    this.applyLineOfSightDeocclusion(input.scene, dtSeconds)

    const minCameraY = input.targetY + this.options.minCameraHeightOffset
    this.clampCameraY(this.desiredCamera, minCameraY)

    if (!this.initialized) {
      this.initialized = true
    }
    this.smoothedCamera.copy(this.desiredCamera)
    this.smoothedLookAt.copy(this.desiredLookAt)
    this.clampCameraY(this.smoothedCamera, minCameraY)

    this.applyFov(input.camera, this.blendedMode.fovDeg, dtSeconds)

    this.finalCamera.copy(this.smoothedCamera)
    this.finalLookAt.copy(this.smoothedLookAt)
    this.finalForward.copy(this.finalLookAt).sub(this.finalCamera)

    let lookDistance = this.finalForward.length()
    if (lookDistance <= EPS) {
      this.finalForward.copy(this.targetForward)
      lookDistance = Math.max(this.blendedMode.cameraDistance, 1)
      this.finalLookAt.copy(this.finalCamera).addScaledVector(this.finalForward, lookDistance)
    } else {
      this.finalForward.multiplyScalar(1 / lookDistance)
    }

    this.noisePosition.set(0, 0, 0)
    this.noiseOrientationRad.set(0, 0, 0)
    this.sampleNoise()

    this.impulsePosition.set(0, 0, 0)
    this.impulseRotationRad.set(0, 0, 0)
    this.sampleImpulse(this.finalCamera)

    this.finalCamera.add(this.noisePosition).add(this.impulsePosition)

    if (aimActive && this.options.aim.enabled) {
      this.computeAimLookAt(input.scene, this.finalForward)
      this.finalLookAt.copy(this.referenceLookAt)
      if (!this.options.aim.noiseCancellation) {
        this.applyOrientationPerturbation(this.finalForward)
        this.finalLookAt.copy(this.finalCamera).addScaledVector(this.finalForward, lookDistance)
        this.referenceLookAt.copy(this.finalLookAt)
      }
    } else {
      this.referenceLookAt.copy(this.finalLookAt)
      this.aimTarget.copy(this.finalLookAt)
      this.applyOrientationPerturbation(this.finalForward)
      this.finalLookAt.copy(this.finalCamera).addScaledVector(this.finalForward, lookDistance)
    }

    input.camera.position.copy(this.finalCamera)
    input.camera.lookAt(this.finalLookAt)

    this.previousTargetPosition.copy(this.root)
  }

  private applyFov(camera: THREE.PerspectiveCamera, targetFov: number, dtSeconds: number): void {
    const clampedFov = clamp(targetFov, 20, 120)
    let nextFov = clampedFov
    if (this.initialized) {
      nextFov = camera.fov + dampDeltaByTime(clampedFov - camera.fov, this.options.modeBlendTime, dtSeconds)
    }
    if (Math.abs(camera.fov - nextFov) > 1e-4) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }
  }

  private updateRigDampingCorrection(dtSeconds: number): void {
    if (!this.initialized || dtSeconds <= EPS) {
      this.dampingCorrectionLocal.set(0, 0, 0)
      return
    }

    this.movementDeltaLocal
      .copy(this.previousTargetPosition)
      .sub(this.root)
      .applyQuaternion(this.inverseHeadingQuat)
    this.dampingCorrectionLocal.add(this.movementDeltaLocal)

    this.dampingCorrectionLocal.x = dampTowardZeroByTime(
      this.dampingCorrectionLocal.x,
      this.options.damping.rigX,
      dtSeconds,
    )
    this.dampingCorrectionLocal.y = dampTowardZeroByTime(
      this.dampingCorrectionLocal.y,
      this.options.damping.rigY,
      dtSeconds,
    )
    this.dampingCorrectionLocal.z = dampTowardZeroByTime(
      this.dampingCorrectionLocal.z,
      this.options.damping.rigZ,
      dtSeconds,
    )
  }

  private computeRigPositions(): void {
    const side = clamp(this.blendedMode.cameraSide, 0, 1)
    const shoulderX = THREE.MathUtils.lerp(
      -this.blendedMode.shoulderOffsetX,
      this.blendedMode.shoulderOffsetX,
      side,
    )

    this.tmpA.set(
      shoulderX + this.dampingCorrectionLocal.x,
      this.blendedMode.shoulderOffsetY + this.dampingCorrectionLocal.y,
      this.blendedMode.shoulderOffsetZ,
    )

    this.desiredShoulder.copy(this.root).add(this.tmpA.applyQuaternion(this.headingQuat))

    this.tmpA.set(0, this.blendedMode.verticalArmLength, 0)
    this.desiredHand.copy(this.desiredShoulder).add(this.tmpA.applyQuaternion(this.targetQuat))
  }

  private applyCollisionResolution(scene: THREE.Scene, desiredDistance: number, dtSeconds: number): void {
    if (!this.options.collisions.enabled) {
      this.collisionCorrection = 0
      return
    }

    const settings = this.options.collisions

    this.tmpA.copy(this.desiredHand).sub(this.root)
    const handDistance = this.tmpA.length()
    if (handDistance > EPS) {
      this.tmpA.multiplyScalar(1 / handDistance)
      const handHitDistance = this.traceObstacleDistance(
        scene,
        this.root,
        this.tmpA,
        handDistance,
        settings.cameraRadius * 1.05,
        settings.layerMask,
        0,
        settings.ignoreTags,
      )
      if (handHitDistance !== null) {
        this.desiredHand.copy(this.root).addScaledVector(
          this.tmpA,
          Math.max(0, handHitDistance - settings.buffer),
        )
      }
    }

    this.rayDirection.copy(this.targetForward).multiplyScalar(-1)

    let desiredCorrection = 0
    if (desiredDistance > EPS) {
      const hitDistance = this.traceObstacleDistance(
        scene,
        this.desiredHand,
        this.rayDirection,
        desiredDistance,
        settings.cameraRadius,
        settings.layerMask,
        0,
        settings.ignoreTags,
      )
      if (hitDistance !== null) {
        const safeDistance = Math.max(
          settings.minDistance,
          hitDistance - settings.buffer,
        )
        desiredCorrection = Math.max(0, desiredDistance - safeDistance)
      }
    }

    desiredCorrection = this.applyCollisionSmoothing(desiredCorrection, dtSeconds)

    const collisionDamping =
      desiredCorrection > this.collisionCorrection
        ? settings.dampingInto
        : settings.dampingFrom

    if (!this.initialized || dtSeconds <= EPS || collisionDamping <= EPS) {
      this.collisionCorrection = desiredCorrection
    } else {
      this.collisionCorrection += dampDeltaByTime(
        desiredCorrection - this.collisionCorrection,
        collisionDamping,
        dtSeconds,
      )
    }

    const correctedDistance = Math.max(settings.minDistance, desiredDistance - this.collisionCorrection)
    this.desiredCamera.copy(this.desiredHand).addScaledVector(this.rayDirection, correctedDistance)
  }

  private applyCollisionSmoothing(desiredCorrection: number, dtSeconds: number): number {
    if (desiredCorrection > EPS) {
      if (desiredCorrection >= this.collisionSmoothingHoldCorrection - 1e-6) {
        this.collisionSmoothingHoldCorrection = desiredCorrection
        this.collisionSmoothingHoldSeconds = this.options.collisions.smoothingTime
      } else if (this.collisionSmoothingHoldSeconds > 0) {
        desiredCorrection = Math.max(desiredCorrection, this.collisionSmoothingHoldCorrection)
      }
    } else if (this.collisionSmoothingHoldSeconds > 0) {
      desiredCorrection = this.collisionSmoothingHoldCorrection
    }

    if (this.collisionSmoothingHoldSeconds > 0) {
      this.collisionSmoothingHoldSeconds = Math.max(0, this.collisionSmoothingHoldSeconds - dtSeconds)
      if (this.collisionSmoothingHoldSeconds <= EPS && desiredCorrection <= EPS) {
        this.collisionSmoothingHoldCorrection = 0
      }
    } else if (desiredCorrection <= EPS) {
      this.collisionSmoothingHoldCorrection = 0
    }

    return desiredCorrection
  }

  private applyLineOfSightDeocclusion(scene: THREE.Scene, dtSeconds: number): void {
    this.desiredOcclusionDisplacement.set(0, 0, 0)

    if (!this.options.collisions.enabled) {
      this.deocclusionDisplacement.set(0, 0, 0)
      this.occlusionStartTime = -1
      return
    }

    const settings = this.options.collisions
    const occlusionMask = settings.layerMask & ~settings.transparentLayerMask
    if (occlusionMask === 0) {
      this.deocclusionDisplacement.set(0, 0, 0)
      this.occlusionStartTime = -1
      return
    }

    this.tmpA.copy(this.desiredCamera).sub(this.desiredLookAt)
    const targetDistance = this.tmpA.length()
    if (targetDistance > EPS) {
      this.tmpA.multiplyScalar(1 / targetDistance)
      const minDistance = settings.minimumDistanceFromTarget + settings.cameraRadius + PRECISION_SLUSH
      if (targetDistance > minDistance) {
        this.rayOrigin.copy(this.desiredLookAt).addScaledVector(this.tmpA, minDistance)
        let rayLength = Math.max(
          targetDistance - minDistance - settings.cameraRadius,
          PRECISION_SLUSH,
        )
        if (settings.distanceLimit > EPS) {
          rayLength = Math.min(rayLength, settings.distanceLimit)
        }

        const obstacleDistance = this.traceObstacleDistance(
          scene,
          this.rayOrigin,
          this.tmpA,
          rayLength,
          settings.cameraRadius,
          occlusionMask,
          0,
          settings.ignoreTags,
        )

        if (obstacleDistance !== null) {
          this.candidateA.copy(this.rayOrigin).addScaledVector(this.tmpA, Math.max(0, obstacleDistance - PRECISION_SLUSH))
          this.candidateB.copy(this.candidateA)

          if (settings.strategy !== 'pull_forward') {
            this.searchDeoccludedCandidate(scene, targetDistance)
          }

          this.desiredOcclusionDisplacement.copy(this.candidateB).sub(this.desiredCamera)
        }
      }
    }

    const hasOcclusion = this.desiredOcclusionDisplacement.lengthSq() > EPS * EPS
    if (!hasOcclusion) {
      this.occlusionStartTime = -1
    } else if (this.occlusionStartTime < 0) {
      this.occlusionStartTime = this.timeSeconds
    }

    if (
      hasOcclusion &&
      settings.minimumOcclusionTime > EPS &&
      this.initialized &&
      this.occlusionStartTime >= 0 &&
      this.timeSeconds - this.occlusionStartTime < settings.minimumOcclusionTime
    ) {
      this.desiredOcclusionDisplacement.copy(this.deocclusionDisplacement)
    }

    this.applyOcclusionSmoothingAndDamping(hasOcclusion, dtSeconds)
    this.desiredCamera.add(this.deocclusionDisplacement)
  }

  private searchDeoccludedCandidate(scene: THREE.Scene, targetDistance: number): void {
    const settings = this.options.collisions

    if (!this.isLineBlocked(scene, this.desiredLookAt, this.desiredCamera)) {
      this.candidateB.copy(this.desiredCamera)
      return
    }

    let bestScore = this.scoreDeocclusionCandidate(this.candidateB)
    const baseDistance =
      settings.strategy === 'preserve_distance'
        ? targetDistance
        : this.candidateB.distanceTo(this.desiredLookAt)

    this.candidateDir.copy(this.desiredCamera).sub(this.desiredLookAt)
    if (this.candidateDir.lengthSq() <= EPS * EPS) {
      this.candidateDir.copy(this.candidateB).sub(this.desiredLookAt)
    }
    if (this.candidateDir.lengthSq() <= EPS * EPS) {
      return
    }
    this.candidateDir.normalize()

    const angleStep = (12 * Math.PI) / 180
    for (let ring = 1; ring <= settings.maximumEffort; ring += 1) {
      const span = ring * 2 + 1
      for (let i = 0; i < span; i += 1) {
        const offset = i - ring
        const yaw = angleStep * offset
        this.candidateQuat.setFromAxisAngle(WORLD_UP, yaw)

        this.candidateA.copy(this.candidateDir).applyQuaternion(this.candidateQuat).normalize()

        if (settings.strategy === 'preserve_height') {
          this.candidateA.multiplyScalar(baseDistance).add(this.desiredLookAt)
          this.candidateA.y = this.desiredCamera.y

          this.tmpA.copy(this.candidateA).sub(this.desiredLookAt)
          const len = this.tmpA.length()
          if (len > EPS) {
            const minDistance = settings.minimumDistanceFromTarget + settings.cameraRadius + PRECISION_SLUSH
            if (len < minDistance) {
              this.candidateA.copy(this.desiredLookAt).addScaledVector(
                this.tmpA.multiplyScalar(1 / len),
                minDistance,
              )
            }
          }
        } else {
          this.candidateA.multiplyScalar(baseDistance).add(this.desiredLookAt)
        }

        if (this.isLineBlocked(scene, this.desiredLookAt, this.candidateA)) {
          continue
        }

        const score = this.scoreDeocclusionCandidate(this.candidateA)
        if (score < bestScore) {
          bestScore = score
          this.candidateB.copy(this.candidateA)
        }
      }
    }
  }

  private scoreDeocclusionCandidate(candidate: THREE.Vector3): number {
    const settings = this.options.collisions
    const positionError = candidate.distanceToSquared(this.desiredCamera)
    if (settings.strategy === 'preserve_height') {
      const heightError = Math.abs(candidate.y - this.desiredCamera.y)
      return positionError + heightError * heightError * 8
    }
    if (settings.strategy === 'preserve_distance') {
      const desiredDistance = this.desiredCamera.distanceTo(this.desiredLookAt)
      const actualDistance = candidate.distanceTo(this.desiredLookAt)
      const distanceError = desiredDistance - actualDistance
      return positionError + distanceError * distanceError * 8
    }
    return positionError
  }

  private applyOcclusionSmoothingAndDamping(hasOcclusion: boolean, dtSeconds: number): void {
    const settings = this.options.collisions

    if (settings.deocclusionSmoothingTime > EPS) {
      this.tmpA.copy(this.desiredCamera)
      this.tmpA.add(this.desiredOcclusionDisplacement)
      this.tmpB.copy(this.tmpA).sub(this.desiredLookAt)
      let distance = this.tmpB.length()
      if (distance > EPS) {
        this.tmpB.multiplyScalar(1 / distance)
        if (
          hasOcclusion &&
          (!this.initialized ||
            this.smoothedOcclusionDistance <= EPS ||
            distance <= this.smoothedOcclusionDistance)
        ) {
          this.smoothedOcclusionDistance = distance
          this.smoothedOcclusionStartTime = this.timeSeconds
        }

        if (
          this.smoothedOcclusionStartTime > 0 &&
          this.timeSeconds - this.smoothedOcclusionStartTime < settings.deocclusionSmoothingTime
        ) {
          distance = Math.min(distance, this.smoothedOcclusionDistance)
        } else if (!hasOcclusion) {
          this.smoothedOcclusionDistance = 0
          this.smoothedOcclusionStartTime = 0
        }

        this.desiredOcclusionDisplacement
          .copy(this.desiredLookAt)
          .addScaledVector(this.tmpB, distance)
          .sub(this.desiredCamera)
      }
    } else if (!hasOcclusion) {
      this.smoothedOcclusionDistance = 0
      this.smoothedOcclusionStartTime = 0
    }

    if (!this.initialized || dtSeconds <= EPS) {
      this.deocclusionDisplacement.copy(this.desiredOcclusionDisplacement)
      return
    }

    const desiredMagSq = this.desiredOcclusionDisplacement.lengthSq()
    const prevMagSq = this.deocclusionDisplacement.lengthSq()
    const dampTime =
      desiredMagSq > prevMagSq
        ? settings.deocclusionDampingWhenOccluded
        : settings.deocclusionDamping

    if (dampTime <= EPS) {
      this.deocclusionDisplacement.copy(this.desiredOcclusionDisplacement)
      return
    }

    this.tmpA.copy(this.desiredOcclusionDisplacement).sub(this.deocclusionDisplacement)
    this.tmpA.x = dampDeltaByTime(this.tmpA.x, dampTime, dtSeconds)
    this.tmpA.y = dampDeltaByTime(this.tmpA.y, dampTime, dtSeconds)
    this.tmpA.z = dampDeltaByTime(this.tmpA.z, dampTime, dtSeconds)
    this.deocclusionDisplacement.add(this.tmpA)

    if (!hasOcclusion && this.deocclusionDisplacement.lengthSq() < 1e-8) {
      this.deocclusionDisplacement.set(0, 0, 0)
    }
  }

  private isLineBlocked(scene: THREE.Scene, from: THREE.Vector3, to: THREE.Vector3): boolean {
    const settings = this.options.collisions
    const mask = settings.layerMask & ~settings.transparentLayerMask
    if (mask === 0) {
      return false
    }

    this.tmpA.copy(to).sub(from)
    const distance = this.tmpA.length()
    const minDistance = settings.minimumDistanceFromTarget + settings.cameraRadius + PRECISION_SLUSH
    if (distance <= minDistance) {
      return true
    }

    this.tmpA.multiplyScalar(1 / distance)
    this.rayOrigin.copy(from).addScaledVector(this.tmpA, minDistance)

    const hitDistance = this.traceObstacleDistance(
      scene,
      this.rayOrigin,
      this.tmpA,
      distance - minDistance,
      settings.cameraRadius,
      mask,
      0,
      settings.ignoreTags,
    )

    return hitDistance !== null
  }

  private computeAimLookAt(scene: THREE.Scene, forwardHint: THREE.Vector3): void {
    const settings = this.options.aim
    const mask = settings.collisionLayerMask

    this.rayOrigin.copy(this.finalCamera)
    this.tmpA.copy(this.playerOrigin).sub(this.finalCamera)

    const playerLocalZ = this.tmpA.dot(this.bodyForward)
    let aimDistance = Math.max(1, settings.aimDistance)
    if (playerLocalZ > 0) {
      this.rayOrigin.addScaledVector(forwardHint, playerLocalZ)
      aimDistance = Math.max(1, aimDistance - playerLocalZ)
    }

    const lookAtDistance = this.traceObstacleDistance(
      scene,
      this.rayOrigin,
      forwardHint,
      aimDistance,
      0,
      mask,
      0,
      settings.ignoreTags,
    )

    if (lookAtDistance !== null) {
      this.referenceLookAt.copy(this.rayOrigin).addScaledVector(forwardHint, lookAtDistance)
    } else {
      this.referenceLookAt.copy(this.rayOrigin).addScaledVector(forwardHint, aimDistance)
    }

    this.tmpA.copy(this.referenceLookAt).sub(this.playerOrigin)
    const playerRayLength = this.tmpA.length()
    if (playerRayLength <= EPS) {
      this.aimTarget.copy(this.referenceLookAt)
      return
    }

    this.tmpA.multiplyScalar(1 / playerRayLength)
    const aimTargetDistance = this.traceObstacleDistance(
      scene,
      this.playerOrigin,
      this.tmpA,
      playerRayLength,
      0,
      mask,
      0,
      settings.ignoreTags,
    )

    if (aimTargetDistance !== null) {
      this.aimTarget.copy(this.playerOrigin).addScaledVector(this.tmpA, aimTargetDistance)
    } else {
      this.aimTarget.copy(this.referenceLookAt)
    }
  }

  private applyOrientationPerturbation(direction: THREE.Vector3): void {
    this.tmpEuler.set(
      this.noiseOrientationRad.x + this.impulseRotationRad.x,
      this.noiseOrientationRad.y + this.impulseRotationRad.y,
      this.noiseOrientationRad.z + this.impulseRotationRad.z,
      'XYZ',
    )
    if (
      Math.abs(this.tmpEuler.x) <= EPS &&
      Math.abs(this.tmpEuler.y) <= EPS &&
      Math.abs(this.tmpEuler.z) <= EPS
    ) {
      return
    }

    this.tmpQuat.setFromEuler(this.tmpEuler)
    direction.applyQuaternion(this.tmpQuat).normalize()
  }

  private sampleNoise(): void {
    const settings = this.options.noise
    if (!settings.enabled || settings.amplitudeGain <= EPS) {
      return
    }

    const t = this.timeSeconds * settings.frequencyGain

    this.noisePosition.set(
      sampleNoiseAxis(settings.position.x, t, this.noisePositionOffsets.x),
      sampleNoiseAxis(settings.position.y, t, this.noisePositionOffsets.y),
      sampleNoiseAxis(settings.position.z, t, this.noisePositionOffsets.z),
    )
    this.noisePosition.multiplyScalar(settings.amplitudeGain)

    this.noiseOrientationRad.set(
      degToRad(sampleNoiseAxis(settings.orientation.x, t, this.noiseOrientationOffsets.x)),
      degToRad(sampleNoiseAxis(settings.orientation.y, t, this.noiseOrientationOffsets.y)),
      degToRad(sampleNoiseAxis(settings.orientation.z, t, this.noiseOrientationOffsets.z)),
    )
    this.noiseOrientationRad.multiplyScalar(settings.amplitudeGain)
  }

  private sampleImpulse(cameraPos: THREE.Vector3): void {
    if (!this.options.impulse.enabled || this.impulseEvents.length === 0) {
      return
    }

    for (let i = this.impulseEvents.length - 1; i >= 0; i -= 1) {
      const event = this.impulseEvents[i]

      const sourceDistance = this.tmpA.copy(cameraPos).sub(event.source).length()
      const travelTime = sourceDistance / Math.max(1, event.propagationSpeed)
      const elapsed = this.timeSeconds - event.startTime - travelTime
      const duration = event.attackTime + event.sustainTime + event.decayTime

      if (elapsed > duration) {
        this.impulseEvents.splice(i, 1)
        continue
      }
      if (elapsed < 0) {
        continue
      }

      const envelope = evaluateEnvelope(elapsed, event.attackTime, event.sustainTime, event.decayTime)
      if (envelope <= EPS) {
        continue
      }

      const distanceScale = evaluateDistanceDecay(
        sourceDistance,
        event.radius,
        event.dissipationDistance,
      )
      const gain = envelope * event.amplitude * distanceScale
      if (gain <= EPS) {
        continue
      }

      this.impulsePosition.addScaledVector(event.position, gain)
      this.impulseRotationRad.addScaledVector(event.rotationRad, gain)
    }
  }

  private traceObstacleDistance(
    scene: THREE.Scene,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    radius: number,
    layerMask: number,
    transparentMask: number,
    ignoreTags: string[],
  ): number | null {
    if (maxDistance <= EPS || layerMask === 0) {
      return null
    }

    const effectiveRadius = Math.max(0, radius)
    let closest = Number.POSITIVE_INFINITY

    if (effectiveRadius > EPS) {
      buildOrthonormalBasis(direction, this.rayRight, this.rayUp)
    }

    for (let i = 0; i < SPHERE_CAST_SAMPLES.length; i += 1) {
      if (effectiveRadius <= EPS && i > 0) {
        break
      }

      const [sx, sy] = SPHERE_CAST_SAMPLES[i]
      this.rayOrigin
        .copy(origin)
        .addScaledVector(this.rayRight, sx * effectiveRadius)
        .addScaledVector(this.rayUp, sy * effectiveRadius)

      this.raycaster.set(this.rayOrigin, direction)
      this.raycaster.near = 0
      this.raycaster.far = maxDistance + effectiveRadius + PRECISION_SLUSH
      this.rayHits.length = 0
      this.raycaster.intersectObjects(scene.children, true, this.rayHits)

      for (let j = 0; j < this.rayHits.length; j += 1) {
        const hit = this.rayHits[j]
        if (
          !isCollisionCandidate(
            hit.object,
            layerMask,
            transparentMask,
            ignoreTags,
          )
        ) {
          continue
        }

        const adjustedDistance = Math.max(0, hit.distance - effectiveRadius)
        if (adjustedDistance < closest) {
          closest = adjustedDistance
        }
        break
      }
    }

    return Number.isFinite(closest) ? closest : null
  }

  private clampCameraY(position: THREE.Vector3, minY: number): void {
    if (position.y < minY) {
      position.y = minY
    }
  }
}

function loadCameraOptions(): ThirdPersonCameraOptions {
  const pitchMinRad = degToRad(envNumber('VITE_CAMERA_PITCH_MIN_DEG', -35))
  const rawPitchMaxRad = degToRad(envNumber('VITE_CAMERA_PITCH_MAX_DEG', 65))
  const pitchMaxRad = Math.max(pitchMinRad + 0.01, rawPitchMaxRad)

  const legacyShoulder = envNumber('VITE_CAMERA_SHOULDER_OFFSET', 0.45)

  const basePositionDamping = normalizeDampingTimeSeconds(
    envNumber('VITE_CAMERA_POSITION_DAMPING', 0.3),
  )

  const freeMode: CameraModeProfile = {
    shoulderOffsetX: envNumber('VITE_CAMERA_SHOULDER_OFFSET_X', legacyShoulder),
    shoulderOffsetY: envNumber('VITE_CAMERA_SHOULDER_OFFSET_Y', 0),
    shoulderOffsetZ: envNumber('VITE_CAMERA_SHOULDER_OFFSET_Z', 0),
    verticalArmLength: envNumber('VITE_CAMERA_VERTICAL_ARM_LENGTH', 1.35),
    cameraSide: clamp(envNumber('VITE_CAMERA_SIDE', 1), 0, 1),
    cameraDistance: envNumber('VITE_CAMERA_DISTANCE', 5.5),
    lookAheadDistance: envNumber('VITE_CAMERA_LOOKAHEAD', 0),
    fovDeg: envNumber('VITE_CAMERA_FOV_DEG', 70),
  }

  const aimMode: CameraModeProfile = {
    shoulderOffsetX: envNumber('VITE_CAMERA_AIM_SHOULDER_OFFSET_X', freeMode.shoulderOffsetX),
    shoulderOffsetY: envNumber('VITE_CAMERA_AIM_SHOULDER_OFFSET_Y', freeMode.shoulderOffsetY),
    shoulderOffsetZ: envNumber('VITE_CAMERA_AIM_SHOULDER_OFFSET_Z', freeMode.shoulderOffsetZ),
    verticalArmLength: envNumber('VITE_CAMERA_AIM_VERTICAL_ARM_LENGTH', freeMode.verticalArmLength),
    cameraSide: clamp(envNumber('VITE_CAMERA_AIM_SIDE', freeMode.cameraSide), 0, 1),
    cameraDistance: envNumber('VITE_CAMERA_AIM_DISTANCE', Math.max(2.75, freeMode.cameraDistance * 0.8)),
    lookAheadDistance: envNumber('VITE_CAMERA_AIM_LOOKAHEAD', freeMode.lookAheadDistance),
    fovDeg: envNumber('VITE_CAMERA_AIM_FOV_DEG', 55),
  }

  const ignoreTags = parseTagList(import.meta.env.VITE_CAMERA_IGNORE_TAGS)

  const collisionLayerMask = envMask('VITE_CAMERA_COLLISION_LAYER_MASK', 0xffff_ffff)
  const transparentLayerMask = envMask('VITE_CAMERA_TRANSPARENT_LAYER_MASK', 0)

  const noisePositionChannels: CameraNoiseAxisChannels = {
    x: [
      { frequency: 0.45, amplitude: 0.015 },
      { frequency: 1.35, amplitude: 0.008 },
    ],
    y: [
      { frequency: 0.6, amplitude: 0.01 },
      { frequency: 1.8, amplitude: 0.006 },
    ],
    z: [
      { frequency: 0.5, amplitude: 0.012 },
      { frequency: 1.5, amplitude: 0.007 },
    ],
  }

  const noiseOrientationChannels: CameraNoiseAxisChannels = {
    x: [
      { frequency: 0.5, amplitude: 0.35 },
      { frequency: 2.1, amplitude: 0.2 },
    ],
    y: [
      { frequency: 0.42, amplitude: 0.3 },
      { frequency: 1.8, amplitude: 0.18 },
    ],
    z: [
      { frequency: 0.35, amplitude: 0.2 },
      { frequency: 1.2, amplitude: 0.15 },
    ],
  }

  return {
    followHeight: envNumber('VITE_CAMERA_FOLLOW_HEIGHT', 0.35),
    minCameraHeightOffset: envNumber('VITE_CAMERA_MIN_HEIGHT_OFFSET', 0.15),
    pitchMinRad,
    pitchMaxRad,
    modeBlendTime: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_MODE_BLEND_SECONDS', 0.12)),
    freeMode,
    aimMode,
    damping: {
      rigX: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_POSITION_DAMPING_X', basePositionDamping)),
      rigY: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_POSITION_DAMPING_Y', basePositionDamping)),
      rigZ: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_POSITION_DAMPING_Z', basePositionDamping)),
      lookAt: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_AIM_DAMPING', 0.15)),
    },
    collisions: {
      enabled: envBool('VITE_CAMERA_COLLISION_ENABLE', true),
      cameraRadius: envNumber('VITE_CAMERA_RADIUS', 0.2),
      buffer: envNumber('VITE_CAMERA_COLLISION_BUFFER', 0.2),
      minDistance: envNumber('VITE_CAMERA_MIN_DISTANCE', 1.1),
      minimumDistanceFromTarget: envNumber('VITE_CAMERA_MIN_TARGET_DISTANCE', 0.3),
      distanceLimit: envNumber('VITE_CAMERA_OCCLUSION_DISTANCE_LIMIT', 0),
      layerMask: collisionLayerMask,
      transparentLayerMask,
      ignoreTags,
      dampingInto: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_COLLISION_DAMPING_INTO', 0)),
      dampingFrom: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_COLLISION_DAMPING_FROM', 0.5)),
      smoothingTime: envNumber('VITE_CAMERA_COLLISION_SMOOTHING_SECONDS', 0),
      minimumOcclusionTime: envNumber('VITE_CAMERA_OCCLUSION_MIN_TIME', 0),
      strategy: parseOcclusionStrategy(import.meta.env.VITE_CAMERA_OCCLUSION_STRATEGY),
      maximumEffort: envInt('VITE_CAMERA_OCCLUSION_MAX_EFFORT', 4, 1, 12),
      deocclusionDamping: normalizeDampingTimeSeconds(envNumber('VITE_CAMERA_DEOCCLUSION_DAMPING', 0.4)),
      deocclusionDampingWhenOccluded: normalizeDampingTimeSeconds(
        envNumber(
          'VITE_CAMERA_DEOCCLUSION_DAMPING_OCCLUDED',
          0.2,
        ),
      ),
      deocclusionSmoothingTime: envNumber('VITE_CAMERA_DEOCCLUSION_SMOOTHING_SECONDS', 0),
    },
    aim: {
      enabled: envBool('VITE_CAMERA_ENABLE_AIM_EXT', true),
      collisionLayerMask: envMask('VITE_CAMERA_AIM_LAYER_MASK', collisionLayerMask),
      ignoreTags:
        parseTagList(import.meta.env.VITE_CAMERA_AIM_IGNORE_TAGS).length > 0
          ? parseTagList(import.meta.env.VITE_CAMERA_AIM_IGNORE_TAGS)
          : ignoreTags,
      aimDistance: envNumber('VITE_CAMERA_AIM_DISTANCE_MAX', 200),
      noiseCancellation: envBool('VITE_CAMERA_AIM_NOISE_CANCELLATION', true),
    },
    noise: {
      enabled: envBool('VITE_CAMERA_NOISE_ENABLED', false),
      amplitudeGain: envNumber('VITE_CAMERA_NOISE_AMPLITUDE_GAIN', 1),
      frequencyGain: envNumber('VITE_CAMERA_NOISE_FREQUENCY_GAIN', 1),
      position: noisePositionChannels,
      orientation: noiseOrientationChannels,
    },
    impulse: {
      enabled: envBool('VITE_CAMERA_IMPULSE_ENABLED', true),
      defaultAmplitude: envNumber('VITE_CAMERA_IMPULSE_DEFAULT_AMPLITUDE', 1),
      defaultAttackTime: envNumber('VITE_CAMERA_IMPULSE_DEFAULT_ATTACK', 0.02),
      defaultSustainTime: envNumber('VITE_CAMERA_IMPULSE_DEFAULT_SUSTAIN', 0.08),
      defaultDecayTime: envNumber('VITE_CAMERA_IMPULSE_DEFAULT_DECAY', 0.24),
      defaultRadius: envNumber('VITE_CAMERA_IMPULSE_DEFAULT_RADIUS', 0),
      defaultDissipationDistance: envNumber(
        'VITE_CAMERA_IMPULSE_DEFAULT_DISSIPATION',
        50,
      ),
      defaultPropagationSpeed: envNumber('VITE_CAMERA_IMPULSE_DEFAULT_PROPAGATION', 9999),
    },
  }
}

function mergeCameraOptions(
  base: ThirdPersonCameraOptions,
  overrides: ThirdPersonCameraOptionsOverrides,
): ThirdPersonCameraOptions {
  const freeMode = {
    ...base.freeMode,
    ...(overrides.freeMode ?? {}),
  }
  const aimMode = {
    ...base.aimMode,
    ...(overrides.aimMode ?? {}),
  }
  const damping = {
    ...base.damping,
    ...(overrides.damping ?? {}),
  }
  const collisionIgnoreTags = overrides.collisions?.ignoreTags
    ? normalizeTagList(overrides.collisions.ignoreTags)
    : base.collisions.ignoreTags
  const collisions = {
    ...base.collisions,
    ...(overrides.collisions ?? {}),
    ignoreTags: collisionIgnoreTags,
  }
  const aimIgnoreTags = overrides.aim?.ignoreTags
    ? normalizeTagList(overrides.aim.ignoreTags)
    : base.aim.ignoreTags
  const aim = {
    ...base.aim,
    ...(overrides.aim ?? {}),
    ignoreTags: aimIgnoreTags,
  }
  const noise = {
    ...base.noise,
    ...(overrides.noise ?? {}),
  }
  const impulse = {
    ...base.impulse,
    ...(overrides.impulse ?? {}),
  }

  return {
    ...base,
    ...overrides,
    freeMode,
    aimMode,
    damping,
    collisions,
    aim,
    noise,
    impulse,
  }
}

function blendModeProfile(
  freeMode: CameraModeProfile,
  aimMode: CameraModeProfile,
  t: number,
  out: CameraModeProfile,
): void {
  out.shoulderOffsetX = THREE.MathUtils.lerp(freeMode.shoulderOffsetX, aimMode.shoulderOffsetX, t)
  out.shoulderOffsetY = THREE.MathUtils.lerp(freeMode.shoulderOffsetY, aimMode.shoulderOffsetY, t)
  out.shoulderOffsetZ = THREE.MathUtils.lerp(freeMode.shoulderOffsetZ, aimMode.shoulderOffsetZ, t)
  out.verticalArmLength = THREE.MathUtils.lerp(freeMode.verticalArmLength, aimMode.verticalArmLength, t)
  out.cameraSide = THREE.MathUtils.lerp(freeMode.cameraSide, aimMode.cameraSide, t)
  out.cameraDistance = THREE.MathUtils.lerp(freeMode.cameraDistance, aimMode.cameraDistance, t)
  out.lookAheadDistance = THREE.MathUtils.lerp(
    freeMode.lookAheadDistance,
    aimMode.lookAheadDistance,
    t,
  )
  out.fovDeg = THREE.MathUtils.lerp(freeMode.fovDeg, aimMode.fovDeg, t)
}

function evaluateEnvelope(
  time: number,
  attackTime: number,
  sustainTime: number,
  decayTime: number,
): number {
  if (time < 0) {
    return 0
  }

  if (attackTime > EPS && time < attackTime) {
    return clamp01(time / attackTime)
  }

  const afterAttack = time - attackTime
  if (afterAttack < sustainTime) {
    return 1
  }

  if (decayTime <= EPS) {
    return 0
  }

  const decayT = clamp01((afterAttack - sustainTime) / decayTime)
  return 1 - decayT
}

function evaluateDistanceDecay(distance: number, radius: number, dissipationDistance: number): number {
  if (distance <= radius) {
    return 1
  }
  if (dissipationDistance <= EPS) {
    return 0
  }
  return clamp01(1 - (distance - radius) / dissipationDistance)
}

function sampleNoiseAxis(channels: CameraNoiseChannel[], time: number, offset: number): number {
  let value = 0
  for (let i = 0; i < channels.length; i += 1) {
    const channel = channels[i]
    const phase = time * channel.frequency + offset + i * 19.713
    if (channel.constant) {
      value += Math.cos(phase * Math.PI * 2) * channel.amplitude * 0.5
    } else {
      value += (pseudoNoise(phase, offset + i * 3.117) - 0.5) * channel.amplitude
    }
  }
  return value
}

function pseudoNoise(t: number, seed: number): number {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function isCollisionCandidate(
  object: THREE.Object3D,
  layerMask: number,
  transparentMask: number,
  ignoreTags: string[],
): boolean {
  if (!object.visible) {
    return false
  }

  const userData = object.userData as Record<string, unknown>
  if (userData.cameraObstacle === false) {
    return false
  }

  const tag = typeof userData.cameraTag === 'string' ? userData.cameraTag.toLowerCase() : ''
  if (tag !== '' && ignoreTags.includes(tag)) {
    return false
  }

  const objectMask = resolveObjectLayerMask(object, userData)
  if ((objectMask & layerMask) === 0) {
    return false
  }
  if ((objectMask & transparentMask) !== 0) {
    return false
  }

  if (userData.cameraObstacle === true) {
    return true
  }

  const meshLike = object as unknown as {
    isMesh?: boolean
    isInstancedMesh?: boolean
    isSkinnedMesh?: boolean
  }
  if (meshLike.isSkinnedMesh) {
    return false
  }
  return Boolean(meshLike.isMesh || meshLike.isInstancedMesh)
}

function resolveObjectLayerMask(object: THREE.Object3D, userData: Record<string, unknown>): number {
  if (typeof userData.cameraLayer === 'number' && Number.isFinite(userData.cameraLayer)) {
    return userData.cameraLayer | 0
  }

  const withMask = object.layers as { mask?: number }
  if (typeof withMask.mask === 'number' && Number.isFinite(withMask.mask)) {
    return withMask.mask | 0
  }

  return 0xffff_ffff
}

function buildOrthonormalBasis(
  direction: THREE.Vector3,
  outRight: THREE.Vector3,
  outUp: THREE.Vector3,
): void {
  outRight.copy(direction).cross(WORLD_UP)
  if (outRight.lengthSq() <= EPS * EPS) {
    outRight.copy(direction).cross(LOCAL_UP)
  }
  outRight.normalize()
  outUp.copy(outRight).cross(direction).normalize()
}

function dampTowardValue(current: number, target: number, dampTime: number, dtSeconds: number): number {
  return current + dampDeltaByTime(target - current, dampTime, dtSeconds)
}

function dampTowardZeroByTime(value: number, dampTime: number, dtSeconds: number): number {
  return value - dampDeltaByTime(value, dampTime, dtSeconds)
}

function dampDeltaByTime(value: number, dampTime: number, dtSeconds: number): number {
  if (Math.abs(value) <= EPS) {
    return 0
  }
  if (dtSeconds <= EPS || dampTime <= EPS) {
    return value
  }
  const kLogNegligibleResidual = -4.605170186
  return value * (1 - Math.exp((kLogNegligibleResidual * dtSeconds) / dampTime))
}

function normalizeDampingTimeSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= EPS) {
    return 0
  }
  if (value > 2) {
    // Backward compatibility: legacy configs often used "bigger is faster" coefficients.
    return 1 / value
  }
  return value
}

function parseOcclusionStrategy(raw: unknown): CameraOcclusionStrategy {
  if (typeof raw !== 'string') {
    return 'pull_forward'
  }
  const value = raw.trim().toLowerCase()
  if (value === 'preserve_height' || value === 'preserve-height') {
    return 'preserve_height'
  }
  if (value === 'preserve_distance' || value === 'preserve-distance') {
    return 'preserve_distance'
  }
  return 'pull_forward'
}

function parseTagList(raw: unknown): string[] {
  if (typeof raw !== 'string') {
    return []
  }
  return normalizeTagList(
    raw
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  )
}

function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (let i = 0; i < tags.length; i += 1) {
    const tag = tags[i].trim().toLowerCase()
    if (tag.length === 0 || seen.has(tag)) {
      continue
    }
    seen.add(tag)
    normalized.push(tag)
  }
  return normalized
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function envNumber(name: string, fallback: number): number {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  const normalized = String(raw).trim().toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return fallback
}

function envMask(name: string, fallback: number): number {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isFinite(value)) {
    return fallback
  }
  return value | 0
}

function envInt(name: string, fallback: number, min: number, max: number): number {
  return clampInt(Math.round(envNumber(name, fallback)), min, max)
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    return 0
  }
  const twoPi = Math.PI * 2
  let normalized = angle % twoPi
  if (normalized > Math.PI) {
    normalized -= twoPi
  } else if (normalized < -Math.PI) {
    normalized += twoPi
  }
  return normalized
}
