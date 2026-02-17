import { Entity } from 'koota'
import { RuntimeContext } from '../types'

export type KnownKeyMap = Map<string, Set<string>>

export type TransformStateRow = {
  entityId: unknown
  regionId: bigint
  position: number[]
  rotation: number[]
}

export type PlayerSessionViewRow = {
  identity: unknown
  regionId: bigint
}

export type WorldGenParamsRow = {
  terrainChunkSize: number
}

export type NpcStateRow = {
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

export type BuildingStateRow = {
  entityId: bigint
  hexX: number
  hexZ: number
  state: number
  requiredItemDefId: bigint
  buildProgress: number
  buildRequired: number
}

export type ResourceNodeRow = {
  entityId: bigint
  regionId: bigint
  chunkX: number
  chunkY: number
  hexX: number
  hexZ: number
  resourceDefId: bigint
  clumpId: number
  resourceType: number
  amount: number
  maxAmount: number
  isDepleted: boolean
}

export type TerrainChunkRow = {
  chunkKey: string
  regionId: bigint
  dimensionId: number
  chunkX: number
  chunkY: number
  biomeId: number
  seed: bigint
  generatedAt: unknown
  heightMin: number
  heightMax: number
  waterRatioPermille: number
}

export type TerrainChunkPayloadRow = {
  chunkKey: string
  regionId: bigint
  dimensionId: number
  chunkX: number
  chunkY: number
  cellPayloadVersion: number
  cellPayloadBytes: Uint8Array
  cellCount: number
  generatedAt: unknown
}

export type ClaimStateRow = {
  claimId: bigint
  ownerIdentity: unknown
  totemBuildingId: unknown
  regionId: unknown
  centerX: number
  centerZ: number
  radius: number
  tier: number
}

export function upsertWorldEntity(
  ctx: RuntimeContext,
  key: string,
  apply: (entity: Entity, isNew: boolean) => void,
): Entity {
  return ctx.world.upsertByNetKey(key, apply)
}

export function pruneTable(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  table: string,
  seen: Set<string>,
): void {
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

export function clearWorld(ctx: RuntimeContext, knownKeys: KnownKeyMap): void {
  knownKeys.clear()
  ctx.world.clear()
}

export function toKeyString(value: unknown): string {
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

export function vec3FromArray(values: number[]): { x: number; y: number; z: number } {
  return {
    x: values[0] ?? 0,
    y: values[1] ?? 0,
    z: values[2] ?? 0,
  }
}

export function quatFromArray(values: number[]): { x: number; y: number; z: number; w: number } {
  return {
    x: values[0] ?? 0,
    y: values[1] ?? 0,
    z: values[2] ?? 0,
    w: values[3] ?? 1,
  }
}

export function normalizeIdentityHex(value: string | null): string | null {
  if (value === null) {
    return null
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }
  return trimmed.toLowerCase().replace(/^0x/, '')
}

export function findLocalSession(
  rows: Iterable<PlayerSessionViewRow>,
  localIdentityHex: string,
): PlayerSessionViewRow | null {
  for (const row of rows) {
    if (normalizeIdentityHex(toKeyString(row.identity)) === localIdentityHex) {
      return row
    }
  }
  return null
}

export function readTerrainChunkSize(rows: Iterable<WorldGenParamsRow>, fallback: number): number {
  for (const row of rows) {
    const size = Math.floor(row.terrainChunkSize)
    if (Number.isFinite(size) && size > 0 && size <= 512) {
      return size
    }
  }
  return fallback
}

export function shouldReanchorAoi(
  localPosition: { x: number; z: number },
  anchorPosition: { x: number; z: number },
  distanceThreshold: number,
): boolean {
  const dx = localPosition.x - anchorPosition.x
  const dz = localPosition.z - anchorPosition.z
  return dx * dx + dz * dz >= distanceThreshold * distanceThreshold
}
