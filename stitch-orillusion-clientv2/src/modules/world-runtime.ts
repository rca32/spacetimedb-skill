import type { RuntimeContext, DomainRuntime } from '../core/types'
import type {
  AnimationStatePayload,
  InputFramePayload,
  PhysicsStepPayload,
  WorldEntityPayload,
  WorldStatePayload,
} from '../core/runtime-events'

export type WorldWeather = 'clear' | 'windy' | 'rain' | 'storm'

export interface WorldSnapshot {
  frameNo: number
  dimensionId: number
  timeOfDaySec: number
  weather: WorldWeather
  dayIndex: number
  profileId: 'low' | 'medium' | 'high' | 'ultra'
}

interface EntityPatch {
  id: bigint
  position: { x: number; y: number; z: number }
  quaternion?: { x: number; y: number; z: number; w: number }
  velocity?: { x: number; y: number; z: number }
  entityType?: 'player' | 'npc' | 'building' | 'resource' | 'projectile' | 'effect'
  state?: string
}

export class WorldRuntime implements DomainRuntime {
  name = 'WorldRuntime'
  private frameNo = 0
  private dimensionId = 1
  private timeOfDaySec = 43200
  private dayIndex = 0
  private weather: WorldWeather = 'clear'
  private nextWeatherFlipMs = 0
  private entities = new Map<bigint, EntityPatch>()
  private profileId: WorldSnapshot['profileId'] = 'low'
  private unsubscribes: Array<() => void> = []
  private lastInput = { x: 0, y: 0, z: 0 }
  private readonly playerId = 1n

  async init(ctx: RuntimeContext): Promise<void> {
    this.reset()

    this.unsubscribes.push(
      ctx.bus.on('INPUT_FRAME', (event) => {
        const payload = this.asInputFrame(event.payload)
        if (!payload) {
          return
        }
        this.lastInput = payload.move
        this.emitServerHint(ctx, {
          frameNo: payload.frameNo,
          entityId: Number(this.playerId),
          entityType: 'player',
          position: this.readEntity(this.playerId).position,
          velocity: this.lastInput,
          reason: 'input_applied',
        })
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('PHYSICS_STEP', (event) => {
        const payload = this.asPhysicsStep(event.payload)
        if (!payload) {
          return
        }
        const bodyId = BigInt(payload.bodyId)
        if (bodyId !== this.playerId) {
          return
        }

        const entity = this.readEntity(bodyId)
        entity.position = {
          x: payload.position.x,
          y: payload.position.y,
          z: payload.position.z,
        }
        entity.velocity = {
          x: payload.velocity.x,
          y: payload.velocity.y,
          z: payload.velocity.z,
        }
        if (this.entities.has(bodyId)) {
          this.entities.set(bodyId, entity)
        }
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('WORLD_DIMENSION_CHANGE', (event) => {
        const nextDimension = Number((event.payload as { dimensionId?: unknown })?.dimensionId ?? event.payload)
        if (Number.isFinite(nextDimension) && nextDimension > 0) {
          this.setDimension(nextDimension, ctx)
        }
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('WORLD_SPAWN_ENTITY', (event) => {
        const payload = this.asWorldEntity(event.payload)
        if (!payload || !Number.isFinite(payload.entityId)) {
          return
        }
        const id = BigInt(payload.entityId)
        if (id === this.playerId) {
          return
        }
        this.spawnEntity(id, payload.position, payload.entityType)
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('WORLD_DESPAWN_ENTITY', (event) => {
        const payload = this.asWorldDespawn(event.payload)
        if (!payload || !Number.isFinite(payload.entityId)) {
          return
        }
        this.despawnEntity(BigInt(payload.entityId))
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('ANIMATION_STATE', (event) => {
        const payload = this.asAnimationState(event.payload)
        if (payload?.state === 'attack' || payload?.state === 'cast') {
          const marker = this.readEntity(this.playerId)
          marker.state = payload.state
          this.entities.set(this.playerId, marker)
        }
      }),
    )

    this.spawnEntity(this.playerId, { x: 0, y: 0, z: 0 }, 'player')
    ctx.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'WORLD_SPAWN_ENTITY',
      payload: {
        entityId: Number(this.playerId),
        entityType: 'player',
        position: { x: 0, y: 0, z: 0 },
        reason: 'world_boot',
      } satisfies WorldEntityPayload,
    })

    ctx.logger.info('[world] boot', { active_entities: this.entities.size })
  }

  update(dtMs: number, ctx: RuntimeContext): void {
    this.frameNo += 1
    const safeDtMs = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 0
    const deltaSec = safeDtMs / 1000

    this.timeOfDaySec = (this.timeOfDaySec + deltaSec) % 86400
    if (this.timeOfDaySec < deltaSec) {
      this.dayIndex += 1
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'WORLD_TICK',
        payload: {
          frameNo: this.frameNo,
          dayIndex: this.dayIndex,
          event: 'day_wrap',
        },
      })
    }

    this.rotateWeatherIfNeeded(ctx)

    const player = this.readEntity(this.playerId)
    if (player) {
      const moveScale = 1.6
      player.position.x += this.lastInput.x * moveScale * deltaSec
      player.position.z += this.lastInput.z * moveScale * deltaSec
      player.velocity = {
        x: this.lastInput.x * moveScale,
        y: player.velocity?.y ?? 0,
        z: this.lastInput.z * moveScale,
      }
      this.entities.set(this.playerId, player)
    }

    const snapshot = this.readSnapshot()
    const nextProfile = snapshot.profileId
    if (this.profileId !== nextProfile) {
      this.profileId = nextProfile
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'WORLD_TICK',
        payload: {
          event: 'profile_change',
          profile: nextProfile,
          frameNo: this.frameNo,
          previousProfile: this.profileId,
        },
      })
    }

    ctx.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'WORLD_STATE_APPLIED',
      payload: {
        frameNo: snapshot.frameNo,
        dimensionId: snapshot.dimensionId,
        timeOfDaySec: snapshot.timeOfDaySec,
        dayIndex: snapshot.dayIndex,
        weather: snapshot.weather,
        profile: snapshot.profileId,
      } satisfies WorldStatePayload,
    })

    ctx.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'WORLD_TICK',
      payload: {
        frameNo: this.frameNo,
        dtMs: safeDtMs,
        dimensionId: this.dimensionId,
        weather: this.weather,
      },
    })
  }

  updateWorldTime(ctx: RuntimeContext): void {
    const now = Date.now()
    const previousWeather = this.weather
    this.rotateWeatherIfNeeded(ctx)
    if (previousWeather !== this.weather) {
      ctx.bus.emit({
        ts: now,
        level: 'info',
        event_code: 'WORLD_STATE_APPLIED',
        payload: {
          event: 'weather',
          frameNo: this.frameNo,
          dimensionId: this.dimensionId,
          weather: this.weather,
          profile: this.profileId,
          timeOfDaySec: this.timeOfDaySec,
          dayIndex: this.dayIndex,
          previousWeather,
        } satisfies WorldStatePayload,
      })
    }
  }

  setDimension(dimensionId: number, ctx?: RuntimeContext): void {
    if (this.dimensionId === dimensionId) {
      return
    }
    const previousDimension = this.dimensionId
    this.dimensionId = dimensionId

    this.entities.forEach((entity) => {
      entity.state = 'dimension_reset'
    })

    if (ctx) {
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'WORLD_STATE_APPLIED',
        payload: {
          event: 'dimension_change',
          frameNo: this.frameNo,
          dimensionId,
          previousDimension,
          weather: this.weather,
          profile: this.profileId,
          timeOfDaySec: this.timeOfDaySec,
          dayIndex: this.dayIndex,
        } satisfies WorldStatePayload,
      })
    }
  }

  spawnEntity(entityId: bigint, snapshot: { x: number; y: number; z: number }, entityType?: EntityPatch['entityType']): void {
    const normalizedId = BigInt(entityId)
    const previous = this.entities.get(normalizedId)
    this.entities.set(normalizedId, {
      id: normalizedId,
      position: previous?.position ? { ...previous.position } : { x: snapshot.x, y: snapshot.y, z: snapshot.z },
      velocity: previous?.velocity ?? { x: 0, y: 0, z: 0 },
      entityType: entityType ?? previous?.entityType,
      state: previous?.state ?? 'active',
      quaternion: previous?.quaternion,
    })
  }

  applyDelta(delta: Partial<EntityPatch> & { id?: bigint }): void {
    if (!delta.id) {
      return
    }
    const normalizedId = BigInt(delta.id)
    const previous = this.entities.get(normalizedId)
    if (!previous) {
      return
    }
    this.entities.set(normalizedId, {
      ...previous,
      ...delta,
      position: {
        ...previous.position,
        ...(delta.position ?? {}),
      },
      velocity: {
        ...(previous.velocity ?? { x: 0, y: 0, z: 0 }),
        ...(delta.velocity ?? {}),
      },
    })
  }

  despawnEntity(entityId: bigint): void {
    this.entities.delete(BigInt(entityId))
  }

  queryEntity(entityId: bigint): {
    id: bigint
    position?: { x: number; y: number; z: number }
    quaternion?: { x: number; y: number; z: number; w: number }
    velocity?: { x: number; y: number; z: number }
    state?: string
    entityType?: EntityPatch['entityType']
  } | null {
    const entity = this.entities.get(BigInt(entityId))
    if (!entity) {
      return null
    }
    return { ...entity }
  }

  readSnapshot(): WorldSnapshot {
    const profileId = this.frameNo > 1500 ? 'ultra' : this.frameNo > 900 ? 'high' : this.frameNo > 300 ? 'medium' : 'low'
    return {
      frameNo: this.frameNo,
      dimensionId: this.dimensionId,
      timeOfDaySec: this.timeOfDaySec,
      weather: this.weather,
      dayIndex: this.dayIndex,
      profileId,
    }
  }

  async dispose(): Promise<void> {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe())
    this.unsubscribes = []
    this.reset()
  }

  private rotateWeatherIfNeeded(ctx?: RuntimeContext): void {
    const now = Date.now()
    if (now < this.nextWeatherFlipMs) {
      return
    }
    const cycle: WorldWeather[] = ['clear', 'windy', 'rain', 'storm']
    const idx = cycle.indexOf(this.weather)
    this.weather = cycle[(idx + 1) % cycle.length]
    this.nextWeatherFlipMs = now + 6000

    if (ctx) {
      ctx.bus.emit({
        ts: now,
        level: 'info',
        event_code: 'WORLD_TICK',
        payload: {
          frameNo: this.frameNo,
          event: 'weather_change',
          weather: this.weather,
          dimensionId: this.dimensionId,
        },
      })
    }
  }

  private reset(): void {
    this.frameNo = 0
    this.dimensionId = 1
    this.timeOfDaySec = 43200
    this.dayIndex = 0
    this.weather = 'clear'
    this.nextWeatherFlipMs = Date.now() + 6000
    this.entities.clear()
    this.profileId = 'low'
    this.lastInput = { x: 0, y: 0, z: 0 }
  }

  private readEntity(entityId: bigint): EntityPatch {
    return (
      this.entities.get(BigInt(entityId)) ?? {
        id: BigInt(entityId),
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      }
    )
  }

  private emitServerHint(ctx: RuntimeContext, payload: WorldEntityPayload): void {
    ctx.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'WORLD_TICK',
      payload,
    })
  }

  private asInputFrame(payload: unknown): InputFramePayload | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as Partial<InputFramePayload>
    if (
      typeof candidate.frameNo !== 'number' ||
      !candidate.move ||
      typeof candidate.move !== 'object' ||
      typeof candidate.move.x !== 'number'
    ) {
      return null
    }

    return {
      frameNo: candidate.frameNo,
      move: {
        x: Number(candidate.move.x),
        y: Number((candidate.move as { y?: number }).y ?? 0),
        z: Number((candidate.move as { z?: number }).z ?? 0),
      },
      look: {
        yaw: Number((candidate.look as { yaw?: number })?.yaw ?? 0),
        pitch: Number((candidate.look as { pitch?: number })?.pitch ?? 0),
      },
      actions: Array.isArray(candidate.actions) ? (candidate.actions as string[]) : [],
    }
  }

  private asPhysicsStep(payload: unknown): PhysicsStepPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as Partial<PhysicsStepPayload>
    if (
      typeof candidate.frameNo !== 'number' ||
      typeof candidate.bodyId !== 'number' ||
      !candidate.position ||
      typeof candidate.position !== 'object' ||
      typeof candidate.velocity !== 'object'
    ) {
      return null
    }

    return {
      frameNo: candidate.frameNo,
      bodyId: candidate.bodyId,
      position: {
        x: Number((candidate.position as { x?: number }).x ?? 0),
        y: Number((candidate.position as { y?: number }).y ?? 0),
        z: Number((candidate.position as { z?: number }).z ?? 0),
      },
      velocity: {
        x: Number((candidate.velocity as { x?: number }).x ?? 0),
        y: Number((candidate.velocity as { y?: number }).y ?? 0),
        z: Number((candidate.velocity as { z?: number }).z ?? 0),
      },
      grounded: !!candidate.grounded,
    }
  }

  private asWorldEntity(payload: unknown): WorldEntityPayload | null {
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
        x: Number((candidate.position as { x?: number }).x ?? 0),
        y: Number((candidate.position as { y?: number }).y ?? 0),
        z: Number((candidate.position as { z?: number }).z ?? 0),
      },
      quaternion: candidate.quaternion,
      velocity: candidate.velocity,
      reason: candidate.reason,
    }
  }

  private asWorldDespawn(payload: unknown): { entityId: number } | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as { entityId?: unknown }
    const entityId = candidate.entityId
    if (typeof entityId !== 'number') {
      return null
    }
    return { entityId }
  }

  private asAnimationState(payload: unknown): AnimationStatePayload | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as Partial<AnimationStatePayload>
    if (typeof candidate.state !== 'string') {
      return null
    }
    return {
      ...candidate,
      state: candidate.state as AnimationStatePayload['state'],
    }
  }
}
