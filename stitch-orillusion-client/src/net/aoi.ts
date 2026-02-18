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

  const region = input.regionId.toString()
  const dimension = input.dimensionId

  if (useV2Streams) {
    const queries = [
      `SELECT * FROM aoi_stream_v2 s WHERE s.region_id = ${region} AND s.dimension_id = ${dimension} AND s.chunk_x BETWEEN ${minChunkX} AND ${maxChunkX} AND s.chunk_y BETWEEN ${minChunkY} AND ${maxChunkY}`,
      `SELECT * FROM physics_state_v2 p WHERE p.region_id = ${region} AND p.dimension_id = ${dimension}`,
      `SELECT * FROM combat_hit_v2 c WHERE c.region_id = ${region} AND c.dimension_id = ${dimension}`,
    ]

    if (input.identityHex) {
      queries.push(
        `SELECT * FROM server_correction_v2 sc WHERE sc.identity = 0x${input.identityHex} AND sc.region_id = ${region} AND sc.dimension_id = ${dimension}`,
      )
    }

    return queries
  }

  return [
    `SELECT * FROM terrain_chunk_stream tc WHERE tc.region_id = ${region} AND tc.dimension_id = ${dimension} AND tc.chunk_x BETWEEN ${minChunkX} AND ${maxChunkX} AND tc.chunk_y BETWEEN ${minChunkY} AND ${maxChunkY}`,
    `SELECT * FROM resource_node rn WHERE rn.region_id = ${region} AND rn.dimension_id = ${dimension}`,
    `SELECT * FROM npc_state_stream ns WHERE ns.region_id = ${region} AND ns.dimension_id = ${dimension}`,
  ]
}

export function hashQueries(queries: string[]): string {
  return queries.join('|')
}
