export interface AoiQueryInput {
  readonly regionId: bigint
  readonly dimensionId: number
  readonly centerX: number
  readonly centerZ: number
  readonly chunkRadius: number
  readonly chunkSize: number
  readonly identityHex?: string | null
}

export function buildAoiQueries(input: AoiQueryInput, useV2Streams: boolean): string[] {
  const minChunkX = Math.floor((input.centerX - input.chunkRadius * input.chunkSize) / input.chunkSize)
  const maxChunkX = Math.floor((input.centerX + input.chunkRadius * input.chunkSize) / input.chunkSize)
  const minChunkY = Math.floor((input.centerZ - input.chunkRadius * input.chunkSize) / input.chunkSize)
  const maxChunkY = Math.floor((input.centerZ + input.chunkRadius * input.chunkSize) / input.chunkSize)
  const minHexX = minChunkX * input.chunkSize
  const maxHexX = (maxChunkX + 1) * input.chunkSize - 1
  const minHexZ = minChunkY * input.chunkSize
  const maxHexZ = (maxChunkY + 1) * input.chunkSize - 1

  const region = input.regionId.toString()
  const dimension = input.dimensionId

  if (useV2Streams) {
    const queries = [
      `SELECT * FROM aoi_stream_v2 WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${minChunkX} AND chunk_x <= ${maxChunkX} AND chunk_y >= ${minChunkY} AND chunk_y <= ${maxChunkY}`,
      `SELECT * FROM physics_state_v2 WHERE region_id = ${region} AND dimension_id = ${dimension}`,
      `SELECT * FROM combat_hit_v2 WHERE region_id = ${region} AND dimension_id = ${dimension}`,
      // Keep legacy world streams in parallel until v2 world population is fully implemented.
      `SELECT * FROM terrain_chunk_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${minChunkX} AND chunk_x <= ${maxChunkX} AND chunk_y >= ${minChunkY} AND chunk_y <= ${maxChunkY}`,
      `SELECT * FROM resource_node WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
      `SELECT * FROM npc_state_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
      `SELECT * FROM transform_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
    ]

    if (input.identityHex) {
      queries.push(
        `SELECT * FROM server_correction_v2 WHERE identity = 0x${input.identityHex} AND region_id = ${region} AND dimension_id = ${dimension}`,
      )
    }

    return queries
  }

  return [
    `SELECT * FROM terrain_chunk_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${minChunkX} AND chunk_x <= ${maxChunkX} AND chunk_y >= ${minChunkY} AND chunk_y <= ${maxChunkY}`,
    `SELECT * FROM resource_node WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM npc_state_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND hex_x >= ${minHexX} AND hex_x <= ${maxHexX} AND hex_z >= ${minHexZ} AND hex_z <= ${maxHexZ}`,
    `SELECT * FROM transform_state WHERE region_id = ${region} AND dimension_id = ${dimension}`,
  ]
}

export function hashQueries(queries: string[]): string {
  return queries.join('|')
}
