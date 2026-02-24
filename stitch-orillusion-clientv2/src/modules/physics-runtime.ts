import type { RuntimeContext, DomainRuntime } from '../core/types'

export interface PhysicsState {
  posX: number
  posY: number
  posZ: number
  velX: number
  velY: number
  velZ: number
}

interface BodyDesc {
  bodyType?: 'box' | 'sphere' | 'capsule' | 'heightfield'
  position?: Partial<PhysicsState>
  velocity?: Partial<PhysicsState>
}

interface Body {
  id: number
  desc: BodyDesc
  state: PhysicsState
  awake: boolean
  bodyType: string
}

interface ConstraintDesc {
  type: 'Hinge' | 'Slider' | 'Fixed' | 'PointToPoint' | 'D6'
}

export class PhysicsRuntime implements DomainRuntime {
  name = 'PhysicsRuntime'
  private state: PhysicsState = { posX: 0, posY: 0, posZ: 0, velX: 0, velY: 0, velZ: 0 }
  private grounded = true
  private bodies = new Map<number, Body>()
  private constraints = new Map<number, ConstraintDesc>()
  private nextBodyId = 1
  private nextConstraintId = 1

  async init(ctx: RuntimeContext): Promise<void> {
    this.reset()
    this.createBody({ bodyType: 'box', position: { posX: 0, posY: 0, posZ: 0 } })
    ctx.logger.info('[physics] initialized')
  }

  update(dtMs: number, _ctx: RuntimeContext): void {
    const dtSec = dtMs / 1000
    const gravity = 9.81

    if (!this.grounded) {
      this.state.velY -= gravity * dtSec
      this.state.posY += this.state.velY * dtSec
      if (this.state.posY <= 0) {
        this.state.posY = 0
        this.state.velY = 0
        this.grounded = true
        _ctx?.bus?.emit({
          ts: Date.now(),
          level: 'info',
          event_code: 'PHYS_SLEEP',
          payload: { event: 'ground_contact', body_count: this.bodies.size },
        })
      }
    }

    if (this.state.velX !== 0 || this.state.velZ !== 0) {
      this.state.posX += this.state.velX * dtSec
      this.state.posZ += this.state.velZ * dtSec
    }

    if (!this.grounded && !isFinite(this.state.posY + this.state.velY)) {
      _ctx?.bus.emit({
        ts: Date.now(),
        level: 'error',
        event_code: 'ASSERT_FAIL',
        payload: { event: 'physics_nans', bodyCount: this.bodies.size },
      })
      this.state.velX = 0
      this.state.velY = 0
      this.state.velZ = 0
      this.state.posY = 0
    }
  }

  createBody(desc: BodyDesc = {}): number {
    const id = this.nextBodyId
    this.nextBodyId += 1
    const state: PhysicsState = {
      posX: desc.position?.posX ?? 0,
      posY: desc.position?.posY ?? 0,
      posZ: desc.position?.posZ ?? 0,
      velX: desc.velocity?.velX ?? 0,
      velY: desc.velocity?.velY ?? 0,
      velZ: desc.velocity?.velZ ?? 0,
    }
    this.bodies.set(id, {
      id,
      desc,
      state,
      awake: true,
      bodyType: desc.bodyType ?? 'box',
    })
    return id
  }

  removeBody(bodyId: number): void {
    this.bodies.delete(bodyId)
  }

  applyImpulse(bodyId: number, impulse: number, point?: { x: number; y: number; z: number }): void {
    const targetBody = this.bodies.get(bodyId)
    if (!targetBody) {
      return
    }
    targetBody.state.velY += impulse
    targetBody.awake = true
    this.grounded = false

    if (point) {
      targetBody.state.velX += point.x
      targetBody.state.velZ += point.z
    }
  }

  setKinematicTarget(bodyId: number, transform: Partial<PhysicsState>): void {
    const targetBody = this.bodies.get(bodyId)
    if (!targetBody) {
      return
    }
    targetBody.state = {
      posX: transform.posX ?? targetBody.state.posX,
      posY: transform.posY ?? targetBody.state.posY,
      posZ: transform.posZ ?? targetBody.state.posZ,
      velX: transform.velX ?? targetBody.state.velX,
      velY: transform.velY ?? targetBody.state.velY,
      velZ: transform.velZ ?? targetBody.state.velZ,
    }
  }

  createConstraint(type: ConstraintDesc['type'], _a: number, _b: number, _params?: Record<string, unknown>): number {
    const id = this.nextConstraintId
    this.nextConstraintId += 1
    this.constraints.set(id, { type })
    return id
  }

  updateConstraint(id: number, params: ConstraintDesc): void {
    if (this.constraints.has(id)) {
      this.constraints.set(id, params)
    }
  }

  removeConstraint(id: number): void {
    this.constraints.delete(id)
  }

  createRope(): number {
    return this.createConstraint('PointToPoint', 0, 0)
  }

  createCloth(): number {
    return this.createConstraint('Fixed', 0, 0)
  }

  triggerCollision(bodyId: number, _event: string): void {
    if (!this.bodies.has(bodyId)) {
      return
    }
    this.grounded = false
  }

  snapshot(): PhysicsState {
    return this.state
  }

  async dispose(): Promise<void> {
    this.reset()
  }

  private reset(): void {
    this.state = { posX: 0, posY: 0, posZ: 0, velX: 0, velY: 0, velZ: 0 }
    this.grounded = true
    this.bodies.clear()
    this.constraints.clear()
  }
}
