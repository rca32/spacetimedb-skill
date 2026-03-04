import type { RuntimeContext, DomainRuntime } from '../core/types'
import type {
  AnimationStatePayload,
  EntitySnapshotPayload,
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

export interface SpatialBounds {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

export interface SpatialRay {
  origin: { x: number; y: number; z: number }
  direction: { x: number; y: number; z: number }
  maxDistance?: number
}

export interface PickHit {
  entityId: bigint
  distance: number
  position: { x: number; y: number; z: number }
  entityType?: EntityType
}

type EntityType = 'player' | 'npc' | 'building' | 'resource' | 'projectile' | 'effect' | 'ui_anchor'
type LifecycleState = 'Discovered' | 'Spawning' | 'Active' | 'Dormant' | 'Despawning' | 'Disposed'
type DespawnReason = 'aoi_exit' | 'world_despawn' | 'dimension_change' | 'disconnect'

interface EntityPatch {
  id: bigint
  parentId?: bigint
  position: { x: number; y: number; z: number }
  localOffset?: { x: number; y: number; z: number }
  quaternion?: { x: number; y: number; z: number; w: number }
  velocity?: { x: number; y: number; z: number }
  entityType?: EntityType
  state?: string
  lifecycle: LifecycleState
  poolable: boolean
  profile?: 'low' | 'medium' | 'high' | 'ultra'
  lastUpdatedAt: number
  lastFrameNo: number
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
  private bus: RuntimeContext['bus'] | null = null
  private readonly poolableTypes = new Set<EntityType>(['projectile', 'effect', 'ui_anchor'])
  private readonly dormantTtlMs = 30_000
  private readonly parentFixtureId = 2n
  private readonly spatialCellSize = 16
  private spatialDirty = true
  private spatialBuckets = new Map<string, Set<bigint>>()

  async init(ctx: RuntimeContext): Promise<void> {
    this.reset()
    this.bus = ctx.bus

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
        entity.lifecycle = 'Active'
        this.entities.set(bodyId, entity)
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
        this.spawnEntity(
          id,
          payload.position,
          payload.entityType,
          this.normalizeDespawnReason(payload.reason),
          { emitWorldEvent: false },
        )
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('WORLD_DESPAWN_ENTITY', (event) => {
        const payload = this.asWorldDespawn(event.payload)
        if (!payload) {
          return
        }
        this.despawnEntity(payload.entityId, this.normalizeDespawnReason(payload.reason), { emitWorldEvent: false })
      }),
    )

    this.unsubscribes.push(
      ctx.bus.on('ANIMATION_STATE', (event) => {
        const payload = this.asAnimationState(event.payload)
        if (!payload) {
          return
        }
        if (payload.state === 'attack' || payload.state === 'cast') {
          const marker = this.readEntity(this.playerId)
          marker.state = payload.state
          this.entities.set(this.playerId, marker)
        }
      }),
    )

    this.spawnEntity(this.playerId, { x: 0, y: 0, z: 0 }, 'player', undefined, { emitWorldEvent: false })
    this.spawnEntity(this.parentFixtureId, { x: 2, y: 0, z: 0 }, 'npc', undefined, { emitWorldEvent: true })
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
    this.evictDormantEntities()

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
      player.lifecycle = 'Active'
      player.lastUpdatedAt = Date.now()
      player.lastFrameNo = this.frameNo
      this.entities.set(this.playerId, player)
      this.spatialDirty = true
      this.emitEntitySnapshot({
        event: 'ENTITY_UPDATE',
        entityId: Number(this.playerId),
        entityType: player.entityType,
        state: player.lifecycle,
        reason: undefined,
        profile: this.profileId,
        position: player.position,
        velocity: player.velocity,
      })
    }

    if (this.frameNo === 180) {
      this.setEntityParent(this.parentFixtureId, this.playerId, true)
    }
    if (this.frameNo === 480) {
      this.setEntityParent(this.parentFixtureId, undefined, false)
    }
    this.applyParentTransforms()

    const snapshot = this.readSnapshot()
    const nextProfile = snapshot.profileId
    const previousProfile = this.profileId
    if (previousProfile !== nextProfile) {
      this.profileId = nextProfile
      this.entities.forEach((entity) => {
        entity.profile = this.profileId
      })
      ctx.bus.emit({
        ts: Date.now(),
        level: 'info',
        event_code: 'WORLD_TICK',
        payload: {
          event: 'profile_change',
          profile: nextProfile,
          frameNo: this.frameNo,
          previousProfile,
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

    const idsToDespawn = [...this.entities.keys()].filter((entityId) => entityId !== this.playerId)
    idsToDespawn.forEach((entityId) => {
      this.despawnEntity(entityId, 'dimension_change', { emitWorldEvent: true })
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

  spawnEntity(
    entityId: bigint,
    snapshot: { x: number; y: number; z: number },
    entityType?: EntityPatch['entityType'],
    reason?: DespawnReason,
    options: { emitWorldEvent?: boolean } = {},
  ): void {
    const emitWorldEvent = options.emitWorldEvent ?? true
    const normalizedId = BigInt(entityId)
    const normalizedType = this.normalizeEntityType(entityType)
    const now = Date.now()
    const previous = this.entities.get(normalizedId)

    if (!previous) {
      const entity: EntityPatch = {
        id: normalizedId,
        position: { ...snapshot },
        localOffset: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        quaternion: undefined,
        entityType: normalizedType,
        state: 'spawned',
        lifecycle: 'Spawning',
        poolable: this.isPoolable(normalizedType),
        profile: this.profileId,
        lastUpdatedAt: now,
        lastFrameNo: this.frameNo,
      }
      this.entities.set(normalizedId, entity)
      this.spatialDirty = true
      this.emitEntitySnapshot({
        event: 'ENTITY_SPAWN_BEGIN',
        entityId: Number(normalizedId),
        entityType: entity.entityType,
        state: entity.lifecycle,
        reason,
        profile: this.profileId,
        position: entity.position,
        velocity: entity.velocity,
      })
      entity.lifecycle = 'Active'
      entity.lastUpdatedAt = Date.now()
      entity.lastFrameNo = this.frameNo
      this.entities.set(normalizedId, entity)
      this.spatialDirty = true
      this.emitEntitySnapshot({
        event: 'ENTITY_SPAWN_DONE',
        entityId: Number(normalizedId),
        entityType: entity.entityType,
        state: entity.lifecycle,
        reason,
        profile: this.profileId,
        position: entity.position,
        velocity: entity.velocity,
      })
      if (emitWorldEvent) {
        this.emitWorldSpawn({
          entityId: Number(normalizedId),
          entityType: entity.entityType,
          position: entity.position,
          reason: reason,
          velocity: entity.velocity,
        })
      }
      return
    }

    if (previous.lifecycle === 'Dormant') {
      previous.position = {
        ...previous.position,
        ...snapshot,
      }
      previous.lifecycle = 'Spawning'
      previous.lastUpdatedAt = now
      previous.lastFrameNo = this.frameNo
      if (normalizedType) {
        previous.entityType = normalizedType
      }

      this.entities.set(normalizedId, previous)
      this.spatialDirty = true
      this.emitEntitySnapshot({
        event: 'ENTITY_SPAWN_BEGIN',
        entityId: Number(normalizedId),
        entityType: previous.entityType,
        state: previous.lifecycle,
        reason,
        profile: this.profileId,
        position: previous.position,
        velocity: previous.velocity,
      })

      previous.lifecycle = 'Active'
      previous.lastUpdatedAt = Date.now()
      previous.lastFrameNo = this.frameNo
      if (normalizedType) {
        previous.entityType = normalizedType
      }
      this.entities.set(normalizedId, previous)
      this.spatialDirty = true

      this.emitEntitySnapshot({
        event: 'ENTITY_SPAWN_DONE',
        entityId: Number(normalizedId),
        entityType: previous.entityType,
        state: previous.lifecycle,
        reason,
        profile: this.profileId,
        position: previous.position,
        velocity: previous.velocity,
      })
      return
    }

    if (previous.lifecycle === 'Disposed') {
      this.entities.delete(normalizedId)
      this.spawnEntity(normalizedId, snapshot, normalizedType, reason, options)
      return
    }

    previous.position = {
      ...previous.position,
      ...snapshot,
    }
    previous.lifecycle = 'Active'
    previous.lastUpdatedAt = now
    previous.lastFrameNo = this.frameNo
    if (normalizedType) {
      previous.entityType = normalizedType
    }
    this.entities.set(normalizedId, previous)
    this.spatialDirty = true
    this.emitEntitySnapshot({
      event: 'ENTITY_UPDATE',
      entityId: Number(normalizedId),
      entityType: previous.entityType,
      state: previous.lifecycle,
      reason,
      profile: this.profileId,
      position: previous.position,
      velocity: previous.velocity,
    })
  }

  applyDelta(delta: Partial<EntityPatch> & { id?: bigint | number }): void {
    if (!delta.id) {
      return
    }
    const normalizedId = BigInt(delta.id)
    const previous = this.entities.get(normalizedId)
    const normalizedType = this.normalizeEntityType(delta.entityType)
    const now = Date.now()

    if (!previous) {
      const fallbackPosition = delta.position ?? { x: 0, y: 0, z: 0 }
      this.spawnEntity(normalizedId, fallbackPosition, normalizedType, undefined)
      return
    }

    const wasDormant = previous.lifecycle === 'Dormant'
    const next: EntityPatch = {
      ...previous,
      ...delta,
      id: normalizedId,
      position: {
        ...previous.position,
        ...(delta.position ?? {}),
      },
      velocity: {
        ...(previous.velocity ?? { x: 0, y: 0, z: 0 }),
        ...(delta.velocity ?? {}),
      },
      lastUpdatedAt: now,
      lastFrameNo: this.frameNo,
      profile: this.profileId,
      lifecycle: wasDormant ? 'Active' : previous.lifecycle,
    }

    if (normalizedType) {
      next.entityType = normalizedType
    }
    this.entities.set(normalizedId, next)
    this.spatialDirty = true

    if (wasDormant) {
      this.emitEntitySnapshot({
        event: 'ENTITY_SPAWN_DONE',
        entityId: Number(normalizedId),
        entityType: next.entityType,
        state: next.lifecycle,
        profile: next.profile,
        position: next.position,
        velocity: next.velocity,
      })
      return
    }

    this.emitEntitySnapshot({
      event: 'ENTITY_UPDATE',
      entityId: Number(normalizedId),
      entityType: next.entityType,
      state: next.lifecycle,
      profile: next.profile,
      position: next.position,
      velocity: next.velocity,
    })
  }

  despawnEntity(
    entityId: bigint | number,
    reason?: DespawnReason,
    options: { emitWorldEvent?: boolean } = {},
  ): void {
    const normalizedId = BigInt(entityId)
    const emitWorldEvent = options.emitWorldEvent ?? false
    const existing = this.entities.get(normalizedId)
    if (!existing || existing.lifecycle === 'Disposed') {
      return
    }
    if (normalizedId === this.playerId) {
      return
    }

    existing.lifecycle = reason === 'aoi_exit' ? 'Dormant' : 'Despawning'
    existing.lastUpdatedAt = Date.now()
    existing.lastFrameNo = this.frameNo
    this.entities.set(normalizedId, existing)

    this.emitEntitySnapshot({
      event: 'ENTITY_DESPAWN',
      entityId: Number(normalizedId),
      entityType: existing.entityType,
      state: existing.lifecycle,
      reason,
      profile: existing.profile,
      position: existing.position,
      velocity: existing.velocity,
    })

    if (reason === 'aoi_exit' && existing.poolable) {
      this.emitEntitySnapshot({
        event: 'ENTITY_POOL_RETURN',
        entityId: Number(normalizedId),
        entityType: existing.entityType,
        state: existing.lifecycle,
        reason,
        profile: existing.profile,
      })
    }

    if (!reason || reason !== 'aoi_exit' || !existing.poolable) {
      if (existing.poolable) {
        this.emitEntitySnapshot({
          event: 'ENTITY_POOL_RETURN',
          entityId: Number(normalizedId),
          entityType: existing.entityType,
          state: 'Disposed',
          reason,
          profile: existing.profile,
        })
      }
      existing.lifecycle = 'Disposed'
      this.entities.delete(normalizedId)
      this.spatialDirty = true
    } else {
      // Keep AOI-exited pooled entities dormant for fast re-activation.
      this.entities.set(normalizedId, existing)
      this.spatialDirty = true
    }

    if (emitWorldEvent) {
      this.emitWorldDespawn(Number(normalizedId), { reason })
    }
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
    return {
      ...entity,
      state: entity.lifecycle,
    }
  }

  buildSpatialIndex(): void {
    this.spatialBuckets.clear()
    for (const [entityId, entity] of this.entities) {
      if (entity.lifecycle === 'Disposed') {
        continue
      }
      const key = this.toBucketKey(entity.position.x, entity.position.z)
      const bucket = this.spatialBuckets.get(key)
      if (bucket) {
        bucket.add(entityId)
      } else {
        this.spatialBuckets.set(key, new Set([entityId]))
      }
    }
    this.spatialDirty = false
  }

  queryVisible(bounds: SpatialBounds): bigint[] {
    this.ensureSpatialIndex()
    const candidates = this.collectBucketCandidates(bounds)
    const visible: bigint[] = []
    for (const entityId of candidates) {
      const entity = this.entities.get(entityId)
      if (!entity || entity.lifecycle === 'Disposed') {
        continue
      }
      const { x, y, z } = entity.position
      if (
        x >= bounds.min.x &&
        x <= bounds.max.x &&
        y >= bounds.min.y &&
        y <= bounds.max.y &&
        z >= bounds.min.z &&
        z <= bounds.max.z
      ) {
        visible.push(entityId)
      }
    }
    return visible
  }

  pick(ray: SpatialRay): PickHit | null {
    this.ensureSpatialIndex()
    const maxDistance = Number.isFinite(ray.maxDistance) && (ray.maxDistance as number) > 0
      ? (ray.maxDistance as number)
      : 128
    const directionLength = Math.hypot(ray.direction.x, ray.direction.y, ray.direction.z) || 1
    const dx = ray.direction.x / directionLength
    const dy = ray.direction.y / directionLength
    const dz = ray.direction.z / directionLength
    let bestHit: PickHit | null = null

    const bounds: SpatialBounds = {
      min: {
        x: Math.min(ray.origin.x, ray.origin.x + dx * maxDistance) - 1,
        y: Math.min(ray.origin.y, ray.origin.y + dy * maxDistance) - 1,
        z: Math.min(ray.origin.z, ray.origin.z + dz * maxDistance) - 1,
      },
      max: {
        x: Math.max(ray.origin.x, ray.origin.x + dx * maxDistance) + 1,
        y: Math.max(ray.origin.y, ray.origin.y + dy * maxDistance) + 1,
        z: Math.max(ray.origin.z, ray.origin.z + dz * maxDistance) + 1,
      },
    }

    const candidates = this.collectBucketCandidates(bounds)
    for (const entityId of candidates) {
      const entity = this.entities.get(entityId)
      if (!entity || entity.lifecycle === 'Disposed') {
        continue
      }
      const vx = entity.position.x - ray.origin.x
      const vy = entity.position.y - ray.origin.y
      const vz = entity.position.z - ray.origin.z
      const projected = vx * dx + vy * dy + vz * dz
      if (projected < 0 || projected > maxDistance) {
        continue
      }

      const closestPoint = {
        x: ray.origin.x + dx * projected,
        y: ray.origin.y + dy * projected,
        z: ray.origin.z + dz * projected,
      }
      const error = Math.hypot(
        entity.position.x - closestPoint.x,
        entity.position.y - closestPoint.y,
        entity.position.z - closestPoint.z,
      )
      if (error > 1.5) {
        continue
      }
      if (!bestHit || projected < bestHit.distance) {
        bestHit = {
          entityId,
          distance: projected,
          position: entity.position,
          entityType: entity.entityType,
        }
      }
    }

    return bestHit
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
    this.bus = null
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

  private ensureSpatialIndex(): void {
    if (this.spatialDirty) {
      this.buildSpatialIndex()
    }
  }

  private collectBucketCandidates(bounds: SpatialBounds): Set<bigint> {
    const candidates = new Set<bigint>()
    const minCellX = Math.floor(bounds.min.x / this.spatialCellSize)
    const maxCellX = Math.floor(bounds.max.x / this.spatialCellSize)
    const minCellZ = Math.floor(bounds.min.z / this.spatialCellSize)
    const maxCellZ = Math.floor(bounds.max.z / this.spatialCellSize)
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
        const key = `${cellX}:${cellZ}`
        const bucket = this.spatialBuckets.get(key)
        if (!bucket) {
          continue
        }
        bucket.forEach((entityId) => candidates.add(entityId))
      }
    }
    return candidates
  }

  private toBucketKey(x: number, z: number): string {
    return `${Math.floor(x / this.spatialCellSize)}:${Math.floor(z / this.spatialCellSize)}`
  }

  private emitEntitySnapshot(payload: EntitySnapshotPayload): void {
    if (!this.bus) {
      return
    }
    this.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: payload.event,
      payload,
    })
  }

  private emitWorldSpawn(entity: {
    entityId: number
    entityType?: EntityPatch['entityType']
    position: { x: number; y: number; z: number }
    parentId?: bigint
    localOffset?: { x: number; y: number; z: number }
    reason?: DespawnReason
    velocity?: { x: number; y: number; z: number }
  }): void {
    if (!this.bus) {
      return
    }
    this.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'WORLD_SPAWN_ENTITY',
      payload: {
        entityId: entity.entityId,
        entityType: this.normalizeWorldEntityType(entity.entityType),
        parentId: entity.parentId ? Number(entity.parentId) : undefined,
        position: entity.position,
        reason: entity.reason,
        velocity: entity.velocity,
        localPosition: entity.localOffset,
      } satisfies WorldEntityPayload,
    })
  }

  private emitWorldDespawn(entityId: number, payload?: { reason?: DespawnReason }): void {
    if (!this.bus) {
      return
    }
    this.bus.emit({
      ts: Date.now(),
      level: 'debug',
      event_code: 'WORLD_DESPAWN_ENTITY',
      payload: {
        entityId,
        reason: payload?.reason,
      } as unknown as WorldEntityPayload,
    })
  }

  private setEntityParent(entityId: bigint, parentId?: bigint, keepWorldTransform = true): void {
    const child = this.entities.get(entityId)
    if (!child) {
      return
    }
    if (!parentId) {
      child.parentId = undefined
      child.localOffset = { x: 0, y: 0, z: 0 }
      this.entities.set(entityId, child)
      this.spatialDirty = true
      this.emitEntitySnapshot({
        event: 'ENTITY_UPDATE',
        entityId: Number(entityId),
        entityType: child.entityType,
        state: child.lifecycle,
        reason: 'parent_change',
        profile: child.profile,
        position: child.position,
        velocity: child.velocity,
        parentId: undefined,
        localPosition: child.localOffset,
      })
      return
    }

    const parent = this.entities.get(parentId)
    if (!parent) {
      return
    }
    if (child.parentId === parentId) {
      return
    }
    const localOffset = keepWorldTransform
      ? {
          x: child.position.x - parent.position.x,
          y: child.position.y - parent.position.y,
          z: child.position.z - parent.position.z,
        }
      : { x: 0, y: 0, z: 0 }

    child.parentId = parentId
    child.localOffset = localOffset
    child.position = {
      x: parent.position.x + localOffset.x,
      y: parent.position.y + localOffset.y,
      z: parent.position.z + localOffset.z,
    }
    this.entities.set(entityId, child)
    this.spatialDirty = true
    this.emitEntitySnapshot({
      event: 'ENTITY_UPDATE',
      entityId: Number(entityId),
      entityType: child.entityType,
      state: child.lifecycle,
      reason: 'parent_change',
      profile: child.profile,
      position: child.position,
      velocity: child.velocity,
      parentId: Number(parentId),
      localPosition: localOffset,
    })
  }

  private applyParentTransforms(): void {
    for (const [id, entity] of this.entities) {
      if (!entity.parentId) {
        continue
      }
      const parent = this.entities.get(entity.parentId)
      if (!parent) {
        entity.parentId = undefined
        entity.localOffset = { x: 0, y: 0, z: 0 }
        this.entities.set(id, entity)
        continue
      }
      const localOffset = entity.localOffset ?? { x: 0, y: 0, z: 0 }
      const expected = {
        x: parent.position.x + localOffset.x,
        y: parent.position.y + localOffset.y,
        z: parent.position.z + localOffset.z,
      }
      if (
        expected.x === entity.position.x &&
        expected.y === entity.position.y &&
        expected.z === entity.position.z
      ) {
        continue
      }
      entity.position = expected
      entity.lastUpdatedAt = Date.now()
      entity.lastFrameNo = this.frameNo
      this.entities.set(id, entity)
      this.spatialDirty = true
      this.emitEntitySnapshot({
        event: 'ENTITY_UPDATE',
        entityId: Number(id),
        entityType: entity.entityType,
        state: entity.lifecycle,
        reason: 'parent_update',
        profile: entity.profile,
        position: expected,
        velocity: entity.velocity,
        parentId: Number(entity.parentId),
        localPosition: localOffset,
      })
    }
  }

  private evictDormantEntities(): void {
    const now = Date.now()
    for (const [entityId, entity] of this.entities) {
      if (entityId === this.playerId) {
        continue
      }
      if (entity.lifecycle !== 'Dormant') {
        continue
      }
      if (now - entity.lastUpdatedAt < this.dormantTtlMs) {
        continue
      }
      this.despawnEntity(entityId, 'world_despawn', { emitWorldEvent: true })
    }
  }

  private isPoolable(entityType: EntityPatch['entityType']): boolean {
    return Boolean(entityType && this.poolableTypes.has(entityType))
  }

  private normalizeEntityType(raw?: string): EntityPatch['entityType'] | undefined {
    if (!raw) {
      return undefined
    }
    if (
      raw === 'player' ||
      raw === 'npc' ||
      raw === 'building' ||
      raw === 'resource' ||
      raw === 'projectile' ||
      raw === 'effect' ||
      raw === 'ui_anchor'
    ) {
      return raw
    }
    return undefined
  }

  private normalizeWorldEntityType(raw?: string | null): WorldEntityPayload['entityType'] | undefined {
    if (!raw) {
      return undefined
    }
    if (
      raw === 'player' ||
      raw === 'npc' ||
      raw === 'building' ||
      raw === 'resource' ||
      raw === 'projectile' ||
      raw === 'effect'
    ) {
      return raw
    }
    return undefined
  }

  private normalizeDespawnReason(payloadReason?: unknown): DespawnReason | undefined {
    if (
      payloadReason === 'aoi_exit' ||
      payloadReason === 'world_despawn' ||
      payloadReason === 'dimension_change' ||
      payloadReason === 'disconnect'
    ) {
      return payloadReason
    }
    return undefined
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
    this.spatialBuckets.clear()
    this.spatialDirty = true
  }

  private readEntity(entityId: bigint): EntityPatch {
    return (
      this.entities.get(BigInt(entityId)) ?? {
        id: BigInt(entityId),
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        state: 'active',
        lifecycle: 'Discovered',
        poolable: false,
        profile: this.profileId,
        lastUpdatedAt: Date.now(),
        lastFrameNo: this.frameNo,
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
      entityType: this.normalizeWorldEntityType(candidate.entityType),
      parentId: typeof candidate.parentId === 'number' ? candidate.parentId : undefined,
      position: {
        x: Number((candidate.position as { x?: number }).x ?? 0),
        y: Number((candidate.position as { y?: number }).y ?? 0),
        z: Number((candidate.position as { z?: number }).z ?? 0),
      },
      quaternion: candidate.quaternion,
      velocity: candidate.velocity,
      localPosition: candidate.localPosition as
        | { x: number; y: number; z: number }
        | undefined,
      reason: candidate.reason as string | undefined,
    }
  }

  private asWorldDespawn(payload: unknown): { entityId: number; reason?: DespawnReason } | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as { entityId?: unknown; reason?: unknown }
    const entityId = candidate.entityId
    if (typeof entityId !== 'number') {
      return null
    }
    return {
      entityId,
      reason: this.normalizeDespawnReason(candidate.reason),
    }
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
