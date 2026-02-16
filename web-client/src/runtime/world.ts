import { Entity } from 'koota'
import { buildWorldAoiQueries, hashQueries } from '../net/aoi'
import { WorldStreamingRenderer } from '../render/world-streaming'
import {
  BuildingData,
  ClaimData,
  ChunkData,
  IsBuilding,
  IsClaim,
  IsLocalPlayer,
  IsNpc,
  IsRemotePlayer,
  IsResourceNode,
  IsTerrainChunk,
  NetEntity,
  Position,
  PresentationTransform,
  ResourceData,
  Rotation,
  WorldObjectKind,
} from '../core/traits'
import { RuntimeContext, RuntimeModule } from './types'

const AOI_SUBSCRIPTION_KEY = 'world-aoi'
const TERRAIN_RADIUS_CHUNKS = 3
const DYNAMIC_RADIUS_CHUNKS = 2
const COMBAT_LIMIT = 500
const CHUNK_SIZE = 16
const ENABLE_WORLD_AOI_SUBSCRIPTION = (import.meta.env.VITE_ENABLE_WORLD_AOI_SUB ?? '1') === '1'
const AOI_UPDATE_MIN_INTERVAL_MS = 500
const AOI_REANCHOR_DISTANCE = CHUNK_SIZE * 1.5
const CAMERA_FOLLOW_DISTANCE = 5.5
const CAMERA_FOLLOW_HEIGHT = 2.0
const CAMERA_FOLLOW_LERP = 0.12
const CAMERA_LOOK_AT_HEIGHT = 1.0

type TransformStateRow = {
  entityId: unknown
  regionId: bigint
  position: number[]
  rotation: number[]
}

type PlayerSessionViewRow = {
  identity: unknown
  regionId: bigint
}

type NpcStateRow = {
  npcId: bigint
  hexX: number
  hexZ: number
  destHexX: number
  destHexZ: number
  role: number
  mood: number
  scheduleKind: number
  nextActionTs: bigint
}

type BuildingStateRow = {
  entityId: bigint
  hexX: number
  hexZ: number
  state: number
  requiredItemDefId: bigint
  buildProgress: number
  buildRequired: number
}

type ResourceNodeRow = {
  entityId: bigint
  resourceType: number
  amount: number
}

type TerrainChunkRow = {
  chunkKey: string
  chunkX: number
  chunkY: number
  biomeId: number
}

type ClaimStateRow = {
  claimId: bigint
  ownerIdentity: unknown
  totemBuildingId: unknown
  regionId: unknown
  centerX: number
  centerZ: number
  radius: number
  tier: number
}

export function createWorldRuntime(): RuntimeModule {
  const knownKeys = new Map<string, Set<string>>()
  let streaming: WorldStreamingRenderer | null = null
  let currentAoiHash = ''
  let localRegionId: bigint | null = null
  let localPosition = { x: 0, z: 0 }
  let aoiAnchorPosition = { x: 0, z: 0 }
  let lastAoiUpdateAtMs = 0
  let lastConnectionActive = false

  return {
    name: 'WorldRuntime',
    start(ctx: RuntimeContext) {
      streaming = new WorldStreamingRenderer(ctx.renderer.scene, ctx.renderer.materials)
      ctx.logger.info('world runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null

      if (!connection || !connection.isActive) {
        if (lastConnectionActive) {
          clearWorld(ctx, knownKeys)
          streaming?.clear()
          currentAoiHash = ''
          localRegionId = null
          aoiAnchorPosition = { x: 0, z: 0 }
          lastAoiUpdateAtMs = 0
          ctx.net?.removeSubscription(AOI_SUBSCRIPTION_KEY)
        }
        lastConnectionActive = false
        return
      }
      lastConnectionActive = true

      if (localIdentityHex) {
        const session = findLocalSession(connection.db.playerSessionView.iter(), localIdentityHex)
        if (session) {
          localRegionId = session.regionId
        }
      }

      if (ENABLE_WORLD_AOI_SUBSCRIPTION && localRegionId !== null) {
        const nowMs = Date.now()
        if (
          currentAoiHash === '' ||
          shouldReanchorAoi(localPosition, aoiAnchorPosition, AOI_REANCHOR_DISTANCE)
        ) {
          aoiAnchorPosition = { x: localPosition.x, z: localPosition.z }
        }

        const queries = buildWorldAoiQueries({
          regionId: localRegionId,
          centerX: aoiAnchorPosition.x,
          centerZ: aoiAnchorPosition.z,
          terrainRadius: TERRAIN_RADIUS_CHUNKS,
          dynamicRadius: DYNAMIC_RADIUS_CHUNKS,
          chunkSize: CHUNK_SIZE,
          combatLimit: COMBAT_LIMIT,
        })

        const nextHash = hashQueries(queries)
        const intervalPassed = nowMs - lastAoiUpdateAtMs >= AOI_UPDATE_MIN_INTERVAL_MS
        if (nextHash !== currentAoiHash && (intervalPassed || currentAoiHash === '')) {
          ctx.net?.setSubscription(AOI_SUBSCRIPTION_KEY, queries)
          currentAoiHash = nextHash
          lastAoiUpdateAtMs = nowMs
        }
      }

      const nextLocalPosition = syncTransformState(ctx, knownKeys, connection.db.transformState.iter(), localIdentityHex)
      if (nextLocalPosition) {
        localPosition = nextLocalPosition
      }
      syncNpcState(ctx, knownKeys, connection.db.npcState.iter())
      syncBuildingState(ctx, knownKeys, connection.db.buildingState.iter())
      syncResourceState(ctx, knownKeys, connection.db.resourceNode.iter())
      syncTerrainChunks(ctx, knownKeys, connection.db.terrainChunk.iter())
      syncClaims(ctx, knownKeys, connection.db.claimState.iter())
      updateThirdPersonCamera(ctx, localPosition, ctx.sync?.getViewYaw() ?? 0)

      streaming?.sync(ctx.world)
    },
    stop(ctx: RuntimeContext) {
      ctx.net?.removeSubscription(AOI_SUBSCRIPTION_KEY)
      clearWorld(ctx, knownKeys)
      streaming?.dispose(ctx.renderer.scene)
      streaming = null
      ctx.logger.info('world runtime stop')
    },
  }
}

function syncTransformState(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<TransformStateRow>,
  localIdentityHex: string | null,
): { x: number; z: number } | null {
  const table = 'transform_state'
  const seen = new Set<string>()
  let localPos: { x: number; z: number } | null = null

  for (const row of rows) {
    const entityHex = toKeyString(row.entityId)
    const key = `${table}:${entityHex}`
    seen.add(key)
    const isLocal = localIdentityHex !== null && entityHex === localIdentityHex

    upsertWorldEntity(ctx, key, (entity, isNew) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, PresentationTransform)
      entity.set(NetEntity, { table, serverId: entityHex })
      entity.set(WorldObjectKind, { kind: 'Player' })
      const rowPos = vec3FromArray(row.position)
      const rowRot = quatFromArray(row.rotation)

      if (isNew) {
        entity.set(Position, rowPos)
        entity.set(Rotation, rowRot)
        entity.set(PresentationTransform, {
          x: rowPos.x,
          y: rowPos.y,
          z: rowPos.z,
          qx: rowRot.x,
          qy: rowRot.y,
          qz: rowRot.z,
          qw: rowRot.w,
        })
      } else if (!isLocal) {
        // Remote avatars follow authoritative stream directly.
        entity.set(Position, rowPos)
        entity.set(Rotation, rowRot)
      }

      if (isLocal) {
        entity.add(IsLocalPlayer)
        if (entity.has(IsRemotePlayer)) {
          entity.remove(IsRemotePlayer)
        }
        const localPosition = entity.get(Position)
        localPos = {
          x: localPosition?.x ?? rowPos.x,
          z: localPosition?.z ?? rowPos.z,
        }
      } else {
        entity.add(IsRemotePlayer)
        if (entity.has(IsLocalPlayer)) {
          entity.remove(IsLocalPlayer)
        }
      }
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  return localPos
}

function syncNpcState(ctx: RuntimeContext, knownKeys: Map<string, Set<string>>, rows: Iterable<NpcStateRow>): void {
  const table = 'npc_state'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.npcId.toString()}`
    seen.add(key)
    const targetPos = { x: row.hexX, y: 0, z: row.hexZ }

    upsertWorldEntity(ctx, key, (entity, isNew) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, PresentationTransform)
      entity.set(NetEntity, { table, serverId: row.npcId.toString() })
      entity.set(WorldObjectKind, { kind: 'Npc' })
      entity.set(Position, targetPos)
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.add(IsNpc)

      if (isNew) {
        entity.set(PresentationTransform, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
        })
      } else if (!entity.has(PresentationTransform)) {
        entity.set(PresentationTransform, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
        })
      }
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}

function syncBuildingState(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<BuildingStateRow>,
): void {
  const table = 'building_state'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.entityId.toString()}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, BuildingData)
      entity.set(NetEntity, { table, serverId: row.entityId.toString() })
      entity.set(WorldObjectKind, { kind: 'Building' })
      entity.set(Position, { x: row.hexX, y: 0, z: row.hexZ })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(BuildingData, {
        state: row.state,
        buildProgress: row.buildProgress,
        buildRequired: row.buildRequired,
        requiredItemDefId: row.requiredItemDefId.toString(),
      })
      entity.add(IsBuilding)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}

function syncResourceState(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<ResourceNodeRow>,
): void {
  const table = 'resource_node'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.entityId.toString()}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, ResourceData)
      entity.set(NetEntity, { table, serverId: row.entityId.toString() })
      entity.set(WorldObjectKind, { kind: 'ResourceNode' })
      entity.set(ResourceData, { resourceType: row.resourceType, amount: row.amount })
      entity.add(IsResourceNode)

      if (!entity.has(Position)) {
        entity.add(Position, Rotation)
        const seed = seededPosition(row.entityId)
        entity.set(Position, { x: seed.x, y: 0, z: seed.z })
        entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      }
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}

function syncTerrainChunks(
  ctx: RuntimeContext,
  knownKeys: Map<string, Set<string>>,
  rows: Iterable<TerrainChunkRow>,
): void {
  const table = 'terrain_chunk'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.chunkKey}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, ChunkData)
      entity.set(NetEntity, { table, serverId: row.chunkKey })
      entity.set(WorldObjectKind, { kind: 'TerrainChunk' })
      entity.set(Position, {
        x: row.chunkX * CHUNK_SIZE + CHUNK_SIZE * 0.5,
        y: 0,
        z: row.chunkY * CHUNK_SIZE + CHUNK_SIZE * 0.5,
      })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(ChunkData, { chunkX: row.chunkX, chunkY: row.chunkY, biomeId: row.biomeId })
      entity.add(IsTerrainChunk)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}

function syncClaims(ctx: RuntimeContext, knownKeys: Map<string, Set<string>>, rows: Iterable<ClaimStateRow>): void {
  const table = 'claim_state'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.claimId.toString()}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, ClaimData)
      entity.set(NetEntity, { table, serverId: row.claimId.toString() })
      entity.set(WorldObjectKind, { kind: 'Claim' })
      entity.set(Position, { x: row.centerX, y: 0, z: row.centerZ })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(ClaimData, {
        radius: row.radius,
        tier: row.tier,
        ownerIdentityHex: toKeyString(row.ownerIdentity),
        totemBuildingId: toKeyString(row.totemBuildingId),
        regionId: toKeyString(row.regionId),
      })
      entity.add(IsClaim)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}

function upsertWorldEntity(
  ctx: RuntimeContext,
  key: string,
  apply: (entity: Entity, isNew: boolean) => void,
): Entity {
  return ctx.world.upsertByNetKey(key, apply)
}

function pruneTable(ctx: RuntimeContext, knownKeys: Map<string, Set<string>>, table: string, seen: Set<string>): void {
  const previous = knownKeys.get(table)
  if (previous) {
    for (const key of previous) {
      if (!seen.has(key)) {
        ctx.world.despawnByNetKey(key)
      }
    }
  }
  knownKeys.set(table, seen)
}

function clearWorld(ctx: RuntimeContext, knownKeys: Map<string, Set<string>>): void {
  knownKeys.clear()
  ctx.world.clear()
}

function toKeyString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return candidate.toHexString()
  }
  return String(value)
}

function vec3FromArray(values: number[]): { x: number; y: number; z: number } {
  return {
    x: values[0] ?? 0,
    y: values[1] ?? 0,
    z: values[2] ?? 0,
  }
}

function quatFromArray(values: number[]): { x: number; y: number; z: number; w: number } {
  return {
    x: values[0] ?? 0,
    y: values[1] ?? 0,
    z: values[2] ?? 0,
    w: values[3] ?? 1,
  }
}

function findLocalSession(rows: Iterable<PlayerSessionViewRow>, localIdentityHex: string): PlayerSessionViewRow | null {
  for (const row of rows) {
    if (toKeyString(row.identity) === localIdentityHex) {
      return row
    }
  }
  return null
}

function seededPosition(seed: bigint): { x: number; z: number } {
  const numeric = Number(seed % 9973n)
  const x = (numeric % 128) - 64
  const z = (Math.floor(numeric / 128) % 128) - 64
  return { x, z }
}

function updateThirdPersonCamera(
  ctx: RuntimeContext,
  localPosition: { x: number; z: number },
  viewYaw: number,
): void {
  const camera = ctx.renderer.camera
  const yaw = Number.isFinite(viewYaw) ? viewYaw : 0
  const sinYaw = Math.sin(yaw)
  const cosYaw = Math.cos(yaw)
  const desiredX = localPosition.x - sinYaw * CAMERA_FOLLOW_DISTANCE
  const desiredY = CAMERA_FOLLOW_HEIGHT
  const desiredZ = localPosition.z + cosYaw * CAMERA_FOLLOW_DISTANCE

  camera.position.x += (desiredX - camera.position.x) * CAMERA_FOLLOW_LERP
  camera.position.y += (desiredY - camera.position.y) * CAMERA_FOLLOW_LERP
  camera.position.z += (desiredZ - camera.position.z) * CAMERA_FOLLOW_LERP
  camera.lookAt(localPosition.x, CAMERA_LOOK_AT_HEIGHT, localPosition.z)
}

function shouldReanchorAoi(
  localPosition: { x: number; z: number },
  anchorPosition: { x: number; z: number },
  distanceThreshold: number,
): boolean {
  const dx = localPosition.x - anchorPosition.x
  const dz = localPosition.z - anchorPosition.z
  return dx * dx + dz * dz >= distanceThreshold * distanceThreshold
}
