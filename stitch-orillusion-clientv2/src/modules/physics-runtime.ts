import type { RuntimeContext, DomainRuntime } from '../core/types'
import type { PhysicsStepPayload, WorldEntityPayload } from '../core/runtime-events'

interface PhysicsState {
  posX: number
  posY: number
  posZ: number
  velX: number
  velY: number
  velZ: number
}

interface Body {
  id: number
  desc: BodyDesc
  state: PhysicsState
  grounded: boolean
  bodyType: string
  awake: boolean
}

interface BodyDesc {
  bodyType?: 'box' | 'sphere' | 'capsule' | 'heightfield'
  position?: Partial<PhysicsState>
  velocity?: Partial<PhysicsState>
}

interface ConstraintDesc {
  type: 'Hinge' | 'Slider' | 'Fixed' | 'PointToPoint' | 'D6'
}

export class PhysicsRuntime implements DomainRuntime {
  name = 'PhysicsRuntime'
  private state: PhysicsState = { posX: 0, posY: 0, posZ: 0, velX: 0, velY: 0, velZ: 0 }
  private bodies = new Map<number, Body>()
  private constraints = new Map<number, ConstraintDesc>()
  private nextBodyId = 1
  private nextConstraintId = 1
  private subscriptions: Array<() => void> = []
  private frameNo = 0
  private scenarioMode: 'idle' | 'combat' | 'cinematic' = 'idle'
  private grounded = true

  async init(ctx: RuntimeContext): Promise<void> {
    this.reset()
    this.createBody({ bodyType: 'box', position: { posX: 0, posY: 0, posZ: 0 } })

    this.subscriptions.push(
      ctx.bus.on('WORLD_SPAWN_ENTITY', (event) => {
        const typed = this.asWorldEntity(event.payload)
        if (!typed) {
          return
        }

        const entityId = Math.floor(typed.entityId)
        if (!Number.isFinite(entityId) || entityId <= 0) {
          return
        }

        const body = this.ensureBody(entityId, {
          bodyType: this.normalizeBodyType(typed.entityType),
          position: {
            posX: typed.position.x,
            posY: typed.position.y,
            posZ: typed.position.z,
          },
          velocity: typed.velocity
            ? {
                velX: typed.velocity.x,
                velY: typed.velocity.y,
                velZ: typed.velocity.z,
              }
            : undefined,
        })
        if (typed.position) {
          body.state.posX = typed.position.x
          body.state.posY = typed.position.y
          body.state.posZ = typed.position.z
        }
        if (typed.velocity) {
          body.state.velX = typed.velocity.x
          body.state.velY = typed.velocity.y
          body.state.velZ = typed.velocity.z
        }
        body.awake = true
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('WORLD_DESPAWN_ENTITY', (event) => {
        const payload = event.payload as { entityId?: unknown }
        const entityId = Number(payload?.entityId)
        if (!Number.isFinite(entityId) || entityId <= 0) {
          return
        }
        this.removeBody(entityId)
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('INPUT_FRAME', (event) => {
        const payload = event.payload as { move?: { x?: unknown; z?: unknown } } | undefined
        const player = this.getBody(1)
        if (!player || !payload?.move) {
          return
        }
        player.state.velX = Number(payload.move.x ?? 0)
        player.state.velZ = Number(payload.move.z ?? 0)
        player.awake = true
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('SCENARIO_MARK', (event) => {
        const payload = event.payload as { mode?: 'combat' | 'cinematic' | 'idle' } | undefined
        this.scenarioMode = payload?.mode ?? this.scenarioMode
      }),
    )

    this.subscriptions.push(
      ctx.bus.on('WORLD_STATE_APPLIED', (event) => {
        const payload = event.payload as { timeOfDaySec?: unknown }
        if (Number.isFinite(Number(payload?.timeOfDaySec)) && Number(payload?.timeOfDaySec) > 43200) {
          this.applyImpulse(1, 1)
        }
      }),
    )

    ctx.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'WORLD_TICK',
      payload: {
        event: 'physics_boot',
        body_count: this.bodies.size,
      },
    })
  }

  update(dtMs: number, ctx: RuntimeContext): void {
    const dtSec = this.toSafeDt(dtMs) / 1000
    this.frameNo += 1
    const gravity = 9.81

    for (const body of this.bodies.values()) {
      if (!body.awake) {
        continue
      }

      if (!body.grounded) {
        body.state.velY -= gravity * dtSec
      }
      const wasGrounded = body.grounded

      body.state.posX += body.state.velX * dtSec
      body.state.posY += body.state.velY * dtSec
      body.state.posZ += body.state.velZ * dtSec

      if (body.state.posY <= 0) {
        body.state.posY = 0
        body.state.velY = 0
        if (!body.grounded) {
          body.grounded = true
          const collisionPayload = {
            bodyId: body.id,
            event: 'ground_contact',
            normal: { x: 0, y: 1, z: 0 },
          }
          ctx.bus.emit({
            ts: Date.now(),
            level: 'debug',
            event_code: 'PHYSICS_COLLISION_ENTER',
            payload: collisionPayload,
          })
          ctx.bus.emit({
            ts: Date.now(),
            level: 'debug',
            event_code: 'PHYS_COLLISION',
            payload: collisionPayload,
          })
          ctx.bus.emit({
            ts: Date.now(),
            level: 'debug',
            event_code: 'PHYS_TRIGGER',
            payload: {
              bodyId: body.id,
              trigger: 'ground_enter',
            },
          })
          ctx.bus.emit({
            ts: Date.now(),
            level: 'debug',
            event_code: 'PHYS_WAKE',
            payload: { bodyId: body.id },
          })
        }
      }
      if (wasGrounded && body.state.posY > 0) {
        body.grounded = false
        const collisionPayload = {
          bodyId: body.id,
          event: 'ground_exit',
          normal: { x: 0, y: 1, z: 0 },
        }
        ctx.bus.emit({
          ts: Date.now(),
          level: 'debug',
          event_code: 'PHYS_COLLISION_EXIT',
          payload: collisionPayload,
        })
        ctx.bus.emit({
          ts: Date.now(),
          level: 'debug',
          event_code: 'PHYS_COLLISION',
          payload: collisionPayload,
        })
      }

      const wasAwake = body.awake
      body.awake =
        Math.abs(body.state.velX) > 0.001 || Math.abs(body.state.velY) > 0.001 || Math.abs(body.state.velZ) > 0.001

      if (wasAwake && !body.awake) {
        ctx.bus.emit({
          ts: Date.now(),
          level: 'debug',
          event_code: 'PHYS_SLEEP',
          payload: { bodyId: body.id },
        })
      }
      if (!wasAwake && body.awake) {
        ctx.bus.emit({
          ts: Date.now(),
          level: 'debug',
          event_code: 'PHYS_WAKE',
          payload: { bodyId: body.id },
        })
      }

      if (body.id === 1) {
        this.state = body.state
      }

      ctx.bus.emit({
        ts: Date.now(),
        level: 'debug',
        event_code: 'PHYSICS_STEP',
        payload: {
          frameNo: this.frameNo,
          bodyId: body.id,
          position: {
            x: body.state.posX,
            y: body.state.posY,
            z: body.state.posZ,
          },
          velocity: {
            x: body.state.velX,
            y: body.state.velY,
            z: body.state.velZ,
          },
          grounded: body.grounded,
        } satisfies PhysicsStepPayload,
      })
    }

    if (dtSec > 1) {
      this.grounded = false
    }
  }

  createBody(desc: BodyDesc = {}, bodyId = this.nextBodyId): number {
    const body = this.createBodyWithId(bodyId, desc)
    return body.id
  }

  removeBody(bodyId: number): void {
    if (bodyId === 1) {
      return
    }
    this.bodies.delete(bodyId)
  }

  applyImpulse(bodyId: number, impulse: number, point?: { x?: number; z?: number }): void {
    const targetBody = this.bodies.get(bodyId)
    if (!targetBody) {
      return
    }
    targetBody.state.velY += Number(impulse)
    targetBody.state.velX += Number(point?.x ?? 0)
    targetBody.state.velZ += Number(point?.z ?? 0)
    targetBody.grounded = false
    targetBody.awake = true
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
    targetBody.awake = true
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

  triggerCollision(bodyId: number, event: string): void {
    const body = this.bodies.get(bodyId)
    if (!body) {
      return
    }
    body.awake = true
    body.state.velY = event ? 0 : 0
  }

  snapshot(): PhysicsState {
    return this.state
  }

  async dispose(): Promise<void> {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.reset()
  }

  private getBody(bodyId: number): Body | undefined {
    return this.bodies.get(bodyId)
  }

  private toSafeDt(dtMs: number): number {
    return Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 16
  }

  private ensureBody(entityId: number, desc: BodyDesc): Body {
    if (!this.bodies.has(entityId)) {
      return this.createBodyWithId(entityId, desc)
    }
    const existing = this.bodies.get(entityId) as Body
    if (desc.position) {
      existing.state = {
        ...existing.state,
        ...desc.position,
      }
    }
    if (desc.velocity) {
      existing.state.velX = desc.velocity.velX ?? existing.state.velX
      existing.state.velY = desc.velocity.velY ?? existing.state.velY
      existing.state.velZ = desc.velocity.velZ ?? existing.state.velZ
    }
    existing.desc = desc
    return existing
  }

  private createBodyWithId(bodyId: number, desc: BodyDesc): Body {
    const state: PhysicsState = {
      posX: desc.position?.posX ?? 0,
      posY: desc.position?.posY ?? 0,
      posZ: desc.position?.posZ ?? 0,
      velX: desc.velocity?.velX ?? 0,
      velY: desc.velocity?.velY ?? 0,
      velZ: desc.velocity?.velZ ?? 0,
    }
    if (bodyId >= this.nextBodyId) {
      this.nextBodyId = bodyId + 1
    }

    const body: Body = {
      id: bodyId,
      desc,
      state,
      grounded: state.posY <= 0,
      bodyType: desc.bodyType ?? 'box',
      awake: true,
    }
    this.bodies.set(bodyId, body)
    return body
  }

  private normalizeBodyType(entityType?: string | undefined): BodyDesc['bodyType'] {
    if (entityType === 'sphere' || entityType === 'capsule' || entityType === 'heightfield' || entityType === 'box') {
      return entityType
    }
    return 'box'
  }

  private asWorldEntity(payload: unknown): {
    entityId: number
    entityType?: WorldEntityPayload['entityType']
    position: { x: number; y: number; z: number }
    velocity?: { x: number; y: number; z: number }
  } | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const candidate = payload as Partial<WorldEntityPayload>
    if (typeof candidate.entityId !== 'number' || !candidate.position || typeof candidate.position !== 'object') {
      return null
    }

    return {
      entityId: candidate.entityId,
      entityType: candidate.entityType,
      position: {
        x: Number((candidate.position as { x?: unknown }).x ?? 0),
        y: Number((candidate.position as { y?: unknown }).y ?? 0),
        z: Number((candidate.position as { z?: unknown }).z ?? 0),
      },
      velocity: candidate.velocity
        ? {
            x: Number((candidate.velocity as { x?: unknown }).x ?? 0),
            y: Number((candidate.velocity as { y?: unknown }).y ?? 0),
            z: Number((candidate.velocity as { z?: unknown }).z ?? 0),
          }
        : undefined,
    }
  }

  private reset(): void {
    this.state = { posX: 0, posY: 0, posZ: 0, velX: 0, velY: 0, velZ: 0 }
    this.grounded = true
    this.bodies.clear()
    this.constraints.clear()
    this.nextBodyId = 1
    this.nextConstraintId = 1
    this.frameNo = 0
  }
}
