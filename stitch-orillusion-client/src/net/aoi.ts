import { worldToHex } from '../core/hex/hex-coords'

export interface AoiQueryInput {
  readonly regionId: bigint
  readonly dimensionId: number
  readonly centerX: number
  readonly centerZ: number
  readonly chunkRadius: number
  readonly chunkSize: number
  readonly identityHex?: string | null
  readonly includeFootprintOverlay?: boolean
}

export function buildAoiQueries(input: AoiQueryInput): string[] {
  const centerHex = worldToHex(input.centerX, input.centerZ, input.dimensionId)
  const centerChunkX = Math.floor(centerHex.q / input.chunkSize)
  const centerChunkY = Math.floor(centerHex.r / input.chunkSize)
  const minChunkX = centerChunkX - input.chunkRadius
  const maxChunkX = centerChunkX + input.chunkRadius
  const minChunkY = centerChunkY - input.chunkRadius
  const maxChunkY = centerChunkY + input.chunkRadius
  const minHexX = minChunkX * input.chunkSize
  const maxHexX = (maxChunkX + 1) * input.chunkSize - 1
  const minHexZ = minChunkY * input.chunkSize
  const maxHexZ = (maxChunkY + 1) * input.chunkSize - 1

  const region = input.regionId.toString()
  const dimension = input.dimensionId
  const includeFootprintOverlay = input.includeFootprintOverlay !== false

  const queries = [
    'SELECT * FROM world_gen_params',
    `SELECT * FROM aoi_stream_v2 WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${minChunkX} AND chunk_x <= ${maxChunkX} AND chunk_y >= ${minChunkY} AND chunk_y <= ${maxChunkY}`,
    `SELECT * FROM physics_state_v2 WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    `SELECT * FROM combat_hit_v2 WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    `SELECT * FROM terrain_chunk_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${minChunkX} AND chunk_x <= ${maxChunkX} AND chunk_y >= ${minChunkY} AND chunk_y <= ${maxChunkY}`,
    `SELECT * FROM terrain_chunk_payload WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${minChunkX} AND chunk_x <= ${maxChunkX} AND chunk_y >= ${minChunkY} AND chunk_y <= ${maxChunkY}`,
    `SELECT * FROM resource_node WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM building_state WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM project_site_state WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM npc_state_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM transform_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
  ]

  if (includeFootprintOverlay) {
    queries.push(
      `SELECT * FROM building_footprint WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    )
  }

  if (input.identityHex) {
    queries.push(
      `SELECT * FROM server_correction_v2 WHERE identity = 0x${input.identityHex} AND region_id = ${region} AND dimension_id = ${dimension}`,
    )
  }

  return queries
}

export function hashQueries(queries: string[]): string {
  return queries.join('|')
}
