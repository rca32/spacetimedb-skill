export interface AoiAnchor {
  regionId: bigint
  centerX: number
  centerZ: number
  terrainRadius: number
  dynamicRadius: number
  chunkSize: number
  combatLimit: number
}

export interface AoiChunkBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function worldToChunk(value: number, chunkSize: number): number {
  return Math.floor(value / chunkSize)
}

export function computeChunkBounds(anchor: AoiAnchor, radius: number): AoiChunkBounds {
  const centerChunkX = worldToChunk(anchor.centerX, anchor.chunkSize)
  const centerChunkY = worldToChunk(anchor.centerZ, anchor.chunkSize)

  return {
    minX: centerChunkX - radius,
    maxX: centerChunkX + radius,
    minY: centerChunkY - radius,
    maxY: centerChunkY + radius,
  }
}

export function buildWorldAoiQueries(anchor: AoiAnchor): string[] {
  const terrainBounds = computeChunkBounds(anchor, anchor.terrainRadius)
  const dynamicChunkBounds = computeChunkBounds(anchor, anchor.dynamicRadius)
  const minHexX = dynamicChunkBounds.minX * anchor.chunkSize
  const maxHexX = (dynamicChunkBounds.maxX + 1) * anchor.chunkSize
  const minHexZ = dynamicChunkBounds.minY * anchor.chunkSize
  const maxHexZ = (dynamicChunkBounds.maxY + 1) * anchor.chunkSize

  const region = anchor.regionId.toString()
  const minimalAoi = (import.meta.env.VITE_MINIMAL_AOI ?? '0') === '1'

  if (minimalAoi) {
    return [
      `SELECT * FROM transform_state WHERE region_id = ${region}`,
      `SELECT * FROM npc_state WHERE region_id = ${region}`,
      `SELECT * FROM combat_state WHERE region_id = ${region}`,
    ]
  }

  return [
    `SELECT * FROM transform_state WHERE region_id = ${region}`,
    // Keep terrain stable to avoid visible popping/vanishing while moving.
    `SELECT * FROM terrain_chunk WHERE region_id = ${region}`,
    `SELECT * FROM building_state WHERE region_id = ${region} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM claim_state WHERE region_id = ${region}`,
    `SELECT * FROM combat_state WHERE region_id = ${region}`,
    // NOTE: Subscription SQL currently does not support ORDER BY/LIMIT in this runtime.
    // Cap logic should be handled client-side until server query support is expanded.
    `SELECT * FROM attack_outcome WHERE region_id = ${region}`,
    `SELECT * FROM npc_state WHERE region_id = ${region}`,
    // resource_node currently has no region_id column in server schema.
    'SELECT * FROM resource_node',
  ]
}

export function hashQueries(queries: string[]): string {
  return queries.join(' || ')
}
