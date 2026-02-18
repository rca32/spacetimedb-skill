export interface AoiAnchor {
  regionId: bigint
  dimensionId: number
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
  const maxHexX = (dynamicChunkBounds.maxX + 1) * anchor.chunkSize - 1
  const minHexZ = dynamicChunkBounds.minY * anchor.chunkSize
  const maxHexZ = (dynamicChunkBounds.maxY + 1) * anchor.chunkSize - 1

  const region = anchor.regionId.toString()
  const dimension = Number.isFinite(anchor.dimensionId) && anchor.dimensionId > 0
    ? Math.floor(anchor.dimensionId)
    : 1
  const minimalAoi = (import.meta.env.VITE_MINIMAL_AOI ?? '0') === '1'

  if (minimalAoi) {
    return [
      'SELECT * FROM world_gen_params',
      `SELECT * FROM transform_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
      `SELECT * FROM combat_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
      `SELECT * FROM npc_state_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    ]
  }

  const queries = [
    'SELECT * FROM world_gen_params',
    `SELECT * FROM transform_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    `SELECT * FROM terrain_chunk_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${terrainBounds.minX} AND chunk_x <= ${terrainBounds.maxX} AND chunk_y >= ${terrainBounds.minY} AND chunk_y <= ${terrainBounds.maxY}`,
    `SELECT * FROM building_state WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM claim_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    `SELECT * FROM combat_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    // NOTE: Subscription SQL currently does not support ORDER BY/LIMIT in this runtime.
    // Cap logic should be handled client-side until server query support is expanded.
    `SELECT * FROM attack_outcome WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    `SELECT * FROM resource_node WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM npc_state_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
  ]
  return queries
}

export function buildTerrainPayloadAoiQuery(anchor: AoiAnchor): string {
  const terrainBounds = computeChunkBounds(anchor, anchor.terrainRadius)
  const region = anchor.regionId.toString()
  const dimension = Number.isFinite(anchor.dimensionId) && anchor.dimensionId > 0
    ? Math.floor(anchor.dimensionId)
    : 1
  return `SELECT * FROM terrain_chunk_payload WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${terrainBounds.minX} AND chunk_x <= ${terrainBounds.maxX} AND chunk_y >= ${terrainBounds.minY} AND chunk_y <= ${terrainBounds.maxY}`
}

export function buildPathDebugQueries(regionId: bigint, dimensionId: number): string[] {
  const region = regionId.toString()
  const dimension = Number.isFinite(dimensionId) && dimensionId > 0
    ? Math.floor(dimensionId)
    : 1
  return [
    `SELECT * FROM path_result WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    `SELECT * FROM path_step WHERE dimension_id = ${dimension}`,
  ]
}

export function hashQueries(queries: string[]): string {
  return queries.join(' || ')
}
