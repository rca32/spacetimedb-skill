import * as THREE from 'three'

export interface ThirdPersonCameraOptions {
  followHeight: number
  shoulderOffsetX: number
  shoulderOffsetY: number
  shoulderOffsetZ: number
  verticalArmLength: number
  cameraSide: number
  cameraDistance: number
  minDistance: number
  lookAheadDistance: number
  positionDamping: number
  aimDamping: number
  collisionBuffer: number
  collisionDampingInto: number
  collisionDampingFrom: number
  collisionSmoothingTime: number
  pitchMinRad: number
  pitchMaxRad: number
}

export interface ThirdPersonCameraUpdateInput {
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  targetX: number
  targetY: number
  targetZ: number
  viewYaw: number
  viewPitch: number
  dtSeconds: number
}

const WORLD_UP = new THREE.Vector3(0, 1, 0)
const LOCAL_FORWARD = new THREE.Vector3(0, 0, -1)
const TMP_TARGET_EULER = new THREE.Euler(0, 0, 0, 'YXZ')

export class ThirdPersonCameraController {
  private readonly options: ThirdPersonCameraOptions

  private readonly desiredShoulder = new THREE.Vector3()
  private readonly desiredHand = new THREE.Vector3()
  private readonly desiredCamera = new THREE.Vector3()
  private readonly desiredLookAt = new THREE.Vector3()

  private readonly smoothedCamera = new THREE.Vector3()
  private readonly smoothedLookAt = new THREE.Vector3()

  private readonly root = new THREE.Vector3()
  private readonly targetForward = new THREE.Vector3()
  private readonly shoulderOffsetLocal = new THREE.Vector3()
  private readonly handOffsetLocal = new THREE.Vector3()
  private readonly movementDeltaLocal = new THREE.Vector3()
  private readonly dampingCorrectionLocal = new THREE.Vector3()
  private readonly previousTargetPosition = new THREE.Vector3()

  private readonly headingQuat = new THREE.Quaternion()
  private readonly inverseHeadingQuat = new THREE.Quaternion()
  private readonly targetQuat = new THREE.Quaternion()
  private readonly rayDirection = new THREE.Vector3()
  private readonly raycaster = new THREE.Raycaster()
  private readonly rayHits: THREE.Intersection<THREE.Object3D>[] = []

  private collisionCorrection = 0
  private smoothingHoldSeconds = 0
  private smoothingHoldCorrection = 0
  private initialized = false

  constructor(options: Partial<ThirdPersonCameraOptions> = {}) {
    this.options = { ...loadCameraOptions(), ...options }
  }

  reset(): void {
    this.initialized = false
    this.collisionCorrection = 0
    this.smoothingHoldSeconds = 0
    this.smoothingHoldCorrection = 0
    this.dampingCorrectionLocal.set(0, 0, 0)
  }

  update(input: ThirdPersonCameraUpdateInput): void {
    const yaw = Number.isFinite(input.viewYaw) ? input.viewYaw : 0
    const pitch = clamp(
      Number.isFinite(input.viewPitch) ? input.viewPitch : 0,
      this.options.pitchMinRad,
      this.options.pitchMaxRad,
    )
    const dtSeconds = Math.max(0, input.dtSeconds)

    this.root.set(input.targetX, input.targetY + this.options.followHeight, input.targetZ)
    this.headingQuat.setFromAxisAngle(WORLD_UP, yaw)
    this.inverseHeadingQuat.copy(this.headingQuat).invert()
    TMP_TARGET_EULER.set(pitch, yaw, 0, 'YXZ')
    this.targetQuat.setFromEuler(TMP_TARGET_EULER)
    this.targetForward.copy(LOCAL_FORWARD).applyQuaternion(this.targetQuat).normalize()

    this.updateRigDampingCorrection(dtSeconds)
    this.computeRigPositions()
    const desiredDistance = Math.max(this.options.minDistance, this.options.cameraDistance - this.dampingCorrectionLocal.z)
    this.desiredCamera.copy(this.desiredHand).addScaledVector(this.targetForward, -desiredDistance)
    this.desiredLookAt.copy(this.desiredHand).addScaledVector(this.targetForward, this.options.lookAheadDistance)

    this.applyCollisionResolution(input.scene, desiredDistance, dtSeconds)

    if (!this.initialized) {
      this.smoothedCamera.copy(this.desiredCamera)
      this.smoothedLookAt.copy(this.desiredLookAt)
      input.camera.position.copy(this.smoothedCamera)
      input.camera.lookAt(this.smoothedLookAt)
      this.previousTargetPosition.copy(this.root)
      this.initialized = true
      return
    }

    const posAlpha = dampingAlpha(this.options.positionDamping, dtSeconds)
    const aimAlpha = dampingAlpha(this.options.aimDamping, dtSeconds)
    this.smoothedCamera.lerp(this.desiredCamera, posAlpha)
    this.smoothedLookAt.lerp(this.desiredLookAt, aimAlpha)

    input.camera.position.copy(this.smoothedCamera)
    input.camera.lookAt(this.smoothedLookAt)
    this.previousTargetPosition.copy(this.root)
  }

  private updateRigDampingCorrection(dtSeconds: number): void {
    if (!this.initialized || dtSeconds <= Number.EPSILON) {
      this.dampingCorrectionLocal.set(0, 0, 0)
      return
    }

    this.movementDeltaLocal
      .copy(this.previousTargetPosition)
      .sub(this.root)
      .applyQuaternion(this.inverseHeadingQuat)
    this.dampingCorrectionLocal.add(this.movementDeltaLocal)

    this.dampingCorrectionLocal.x = dampTowardZero(this.dampingCorrectionLocal.x, this.options.positionDamping, dtSeconds)
    this.dampingCorrectionLocal.y = dampTowardZero(this.dampingCorrectionLocal.y, this.options.positionDamping, dtSeconds)
    this.dampingCorrectionLocal.z = dampTowardZero(this.dampingCorrectionLocal.z, this.options.positionDamping, dtSeconds)
  }

  private computeRigPositions(): void {
    const side = clamp(this.options.cameraSide, 0, 1)
    const shoulderX = THREE.MathUtils.lerp(-this.options.shoulderOffsetX, this.options.shoulderOffsetX, side)
    this.shoulderOffsetLocal.set(
      shoulderX + this.dampingCorrectionLocal.x,
      this.options.shoulderOffsetY + this.dampingCorrectionLocal.y,
      this.options.shoulderOffsetZ,
    )

    this.desiredShoulder.copy(this.root).add(this.shoulderOffsetLocal.applyQuaternion(this.headingQuat))
    this.handOffsetLocal.set(0, this.options.verticalArmLength, 0)
    this.desiredHand.copy(this.desiredShoulder).add(this.handOffsetLocal.applyQuaternion(this.targetQuat))
  }

  private applyCollisionResolution(scene: THREE.Scene, desiredDistance: number, dtSeconds: number): void {
    this.rayDirection.copy(this.targetForward).multiplyScalar(-1)
    let desiredCorrection = 0
    if (desiredDistance > 1e-5) {
      this.raycaster.set(this.desiredHand, this.rayDirection)
      this.raycaster.near = 0
      this.raycaster.far = desiredDistance
      this.rayHits.length = 0
      this.raycaster.intersectObjects(scene.children, true, this.rayHits)

      const hit = this.rayHits.find((entry) => isCameraObstacle(entry.object))
      if (hit) {
        const safeDistance = Math.max(this.options.minDistance, hit.distance - this.options.collisionBuffer)
        desiredCorrection = Math.max(0, desiredDistance - safeDistance)
      }
    }

    desiredCorrection = this.applyCollisionSmoothing(desiredCorrection, dtSeconds)

    const collisionDamping =
      desiredCorrection > this.collisionCorrection ? this.options.collisionDampingInto : this.options.collisionDampingFrom
    if (!this.initialized || dtSeconds <= Number.EPSILON || collisionDamping <= Number.EPSILON) {
      this.collisionCorrection = desiredCorrection
    } else {
      this.collisionCorrection += dampDelta(desiredCorrection - this.collisionCorrection, collisionDamping, dtSeconds)
    }

    const correctedDistance = Math.max(this.options.minDistance, desiredDistance - this.collisionCorrection)
    this.desiredCamera.copy(this.desiredHand).addScaledVector(this.rayDirection, correctedDistance)
  }

  private applyCollisionSmoothing(desiredCorrection: number, dtSeconds: number): number {
    if (desiredCorrection > Number.EPSILON) {
      if (desiredCorrection >= this.smoothingHoldCorrection - 1e-6) {
        this.smoothingHoldCorrection = desiredCorrection
        this.smoothingHoldSeconds = this.options.collisionSmoothingTime
      } else if (this.smoothingHoldSeconds > 0) {
        desiredCorrection = Math.max(desiredCorrection, this.smoothingHoldCorrection)
      }
    } else if (this.smoothingHoldSeconds > 0) {
      desiredCorrection = this.smoothingHoldCorrection
    }

    if (this.smoothingHoldSeconds > 0) {
      this.smoothingHoldSeconds = Math.max(0, this.smoothingHoldSeconds - dtSeconds)
      if (this.smoothingHoldSeconds <= Number.EPSILON && desiredCorrection <= Number.EPSILON) {
        this.smoothingHoldCorrection = 0
      }
    } else if (desiredCorrection <= Number.EPSILON) {
      this.smoothingHoldCorrection = 0
    }
    return desiredCorrection
  }
}

function isCameraObstacle(object: THREE.Object3D): boolean {
  if (!object.visible) {
    return false
  }
  if (object.userData?.cameraObstacle === false) {
    return false
  }
  if (object.userData?.cameraObstacle === true) {
    return true
  }

  const meshLike = object as THREE.Mesh
  if ((meshLike as unknown as { isSkinnedMesh?: boolean }).isSkinnedMesh) {
    return false
  }
  return Boolean(
    (meshLike as unknown as { isMesh?: boolean }).isMesh ||
      (meshLike as unknown as { isInstancedMesh?: boolean }).isInstancedMesh,
  )
}

function loadCameraOptions(): ThirdPersonCameraOptions {
  const pitchMinRad = degToRad(envNumber('VITE_CAMERA_PITCH_MIN_DEG', -35))
  const rawPitchMaxRad = degToRad(envNumber('VITE_CAMERA_PITCH_MAX_DEG', 65))
  const pitchMaxRad = Math.max(pitchMinRad + 0.01, rawPitchMaxRad)
  const legacyShoulder = envNumber('VITE_CAMERA_SHOULDER_OFFSET', 0.45)

  return {
    followHeight: envNumber('VITE_CAMERA_FOLLOW_HEIGHT', 0.35),
    shoulderOffsetX: envNumber('VITE_CAMERA_SHOULDER_OFFSET_X', legacyShoulder),
    shoulderOffsetY: envNumber('VITE_CAMERA_SHOULDER_OFFSET_Y', 0),
    shoulderOffsetZ: envNumber('VITE_CAMERA_SHOULDER_OFFSET_Z', 0),
    verticalArmLength: envNumber('VITE_CAMERA_VERTICAL_ARM_LENGTH', 1.35),
    cameraSide: clamp(envNumber('VITE_CAMERA_SIDE', 1), 0, 1),
    cameraDistance: envNumber('VITE_CAMERA_DISTANCE', 5.5),
    minDistance: envNumber('VITE_CAMERA_MIN_DISTANCE', 1.1),
    lookAheadDistance: envNumber('VITE_CAMERA_LOOKAHEAD', 0),
    positionDamping: envNumber('VITE_CAMERA_POSITION_DAMPING', 9),
    aimDamping: envNumber('VITE_CAMERA_AIM_DAMPING', 12),
    collisionBuffer: envNumber('VITE_CAMERA_COLLISION_BUFFER', 0.2),
    collisionDampingInto: envNumber('VITE_CAMERA_COLLISION_DAMPING_INTO', 0),
    collisionDampingFrom: envNumber('VITE_CAMERA_COLLISION_DAMPING_FROM', 8),
    collisionSmoothingTime: envNumber('VITE_CAMERA_COLLISION_SMOOTHING_SECONDS', 0),
    pitchMinRad,
    pitchMaxRad,
  }
}

function dampingAlpha(lambda: number, dtSeconds: number): number {
  if (dtSeconds <= 0) {
    return 0
  }
  if (lambda <= 0) {
    return 1
  }
  return 1 - Math.exp(-lambda * dtSeconds)
}

function dampTowardZero(value: number, damping: number, dtSeconds: number): number {
  if (Math.abs(value) <= Number.EPSILON) {
    return 0
  }
  return value * (1 - dampingAlpha(damping, dtSeconds))
}

function dampDelta(delta: number, damping: number, dtSeconds: number): number {
  return delta * dampingAlpha(damping, dtSeconds)
}

function envNumber(name: string, fallback: number): number {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === null || raw === '') {
    return fallback
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
