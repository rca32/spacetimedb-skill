export interface TerrainHeightSampler {
  sampleHeight: (worldX: number, worldZ: number) => number | null
}

export interface KinematicTerrainSolverParams {
  readonly maxStepHeight: number
  readonly maxSlopeDeg: number
  readonly groundSnapDist: number
  readonly gravity: number
  readonly terminalVelocity: number
  readonly jumpVelocity: number
  readonly substepsPerFrame: number
}

export interface KinematicTerrainState {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly velocityY: number
  readonly grounded: boolean
  readonly groundOffset: number
}

export interface KinematicTerrainInput {
  readonly inputX: number
  readonly inputZ: number
  readonly requestedSpeed: number
  readonly jump: boolean
  readonly dtSeconds: number
}

const DEFAULT_PARAMS: KinematicTerrainSolverParams = {
  maxStepHeight: 0.45,
  maxSlopeDeg: 42,
  groundSnapDist: 0.35,
  gravity: 24,
  terminalVelocity: 40,
  jumpVelocity: 7.5,
  substepsPerFrame: 2,
}

const EPSILON = 0.000001

export function solveKinematicTerrainStep(
  state: KinematicTerrainState,
  input: KinematicTerrainInput,
  terrain: TerrainHeightSampler,
  overrides: Partial<KinematicTerrainSolverParams> = {},
): KinematicTerrainState {
  const params: KinematicTerrainSolverParams = {
    ...DEFAULT_PARAMS,
    ...overrides,
  }

  const dtSeconds = sanitizeDt(input.dtSeconds)
  const steps = Math.max(1, Math.trunc(params.substepsPerFrame))
  const stepDt = dtSeconds / steps
  const direction = normalize2(input.inputX, input.inputZ)

  let x = state.x
  let y = state.y
  let z = state.z
  let velocityY = state.velocityY
  let grounded = state.grounded
  const groundOffset = state.groundOffset

  for (let i = 0; i < steps; i += 1) {
    const horizontalDistance = input.requestedSpeed * stepDt
    const moveX = direction.x * horizontalDistance
    const moveZ = direction.z * horizontalDistance

    if (Math.abs(moveX) > EPSILON || Math.abs(moveZ) > EPSILON) {
      const candidateX = x + moveX
      const candidateZ = z + moveZ
      const fromGround = terrain.sampleHeight(x, z)
      const toGround = terrain.sampleHeight(candidateX, candidateZ)
      if (canTraverse(fromGround, toGround, moveX, moveZ, params)) {
        x = candidateX
        z = candidateZ
      }
    }

    const groundY = terrain.sampleHeight(x, z)
    const targetFootY = groundY === null ? null : groundY + groundOffset

    if (input.jump && grounded) {
      velocityY = params.jumpVelocity
      grounded = false
    }

    if (targetFootY !== null) {
      if (y < targetFootY) {
        y = targetFootY
        velocityY = 0
        grounded = true
      } else {
        const drop = y - targetFootY
        if (drop <= params.groundSnapDist && velocityY <= 0) {
          y = targetFootY
          velocityY = 0
          grounded = true
        } else {
          grounded = false
        }
      }
    } else {
      // Keep the last stable vertical state until terrain payload arrives.
      if (grounded) {
        velocityY = 0
      }
    }

    if (!grounded && targetFootY !== null) {
      velocityY = Math.max(velocityY - params.gravity * stepDt, -params.terminalVelocity)
      y += velocityY * stepDt

      if (targetFootY !== null && y < targetFootY) {
        y = targetFootY
        velocityY = 0
        grounded = true
      }
    }
  }

  return {
    x,
    y,
    z,
    velocityY,
    grounded,
    groundOffset,
  }
}

function canTraverse(
  fromGround: number | null,
  toGround: number | null,
  moveX: number,
  moveZ: number,
  params: KinematicTerrainSolverParams,
): boolean {
  if (toGround === null) {
    return fromGround === null
  }
  if (fromGround === null) {
    return true
  }

  const climb = toGround - fromGround
  if (climb > params.maxStepHeight) {
    return false
  }

  const horizontalDistance = Math.max(EPSILON, Math.hypot(moveX, moveZ))
  const slopeDeg = (Math.atan2(Math.abs(climb), horizontalDistance) * 180) / Math.PI
  return slopeDeg <= params.maxSlopeDeg
}

function normalize2(x: number, z: number): { x: number; z: number } {
  const length = Math.hypot(x, z)
  if (length <= EPSILON) {
    return { x: 0, z: 0 }
  }
  return { x: x / length, z: z / length }
}

function sanitizeDt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1 / 60
  }
  return Math.min(value, 0.05)
}
