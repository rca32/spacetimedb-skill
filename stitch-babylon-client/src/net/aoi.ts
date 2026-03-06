import type { AoiWindow } from '../runtime/types'

export const DEFAULT_CHUNK_SIZE = 32
export const AOI_RADIUS_CHUNKS = 2
export const AOI_HYSTERESIS_CHUNKS = 1

export interface WorldPosition {
  x: number
  z: number
}

export interface SessionQueryInput {
  identityHex: string
  regionId: bigint
  dimensionId: number
}

export function worldToHex(x: number, z: number, dimension = 1): { q: number; r: number; dimension: number } {
  return {
    q: Number.isFinite(x) ? Math.floor(x) : 0,
    r: Number.isFinite(z) ? Math.floor(z) : 0,
    dimension: clampDimension(dimension),
  }
}

export function computeAoiWindow(
  regionId: bigint,
  dimensionId: number,
  position: WorldPosition,
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkRadius = AOI_RADIUS_CHUNKS,
): AoiWindow {
  const centerHex = worldToHex(position.x, position.z, dimensionId)
  const centerChunkX = Math.floor(centerHex.q / chunkSize)
  const centerChunkY = Math.floor(centerHex.r / chunkSize)
  return {
    regionId,
    dimensionId: clampDimension(dimensionId),
    minChunkX: centerChunkX - chunkRadius,
    maxChunkX: centerChunkX + chunkRadius,
    minChunkY: centerChunkY - chunkRadius,
    maxChunkY: centerChunkY + chunkRadius,
    chunkRadius,
  }
}

export function shouldRecomputeAoi(previous: AoiWindow | null, next: AoiWindow): boolean {
  if (!previous) {
    return true
  }
  const previousCenterX = Math.trunc((previous.minChunkX + previous.maxChunkX) / 2)
  const previousCenterY = Math.trunc((previous.minChunkY + previous.maxChunkY) / 2)
  const nextCenterX = Math.trunc((next.minChunkX + next.maxChunkX) / 2)
  const nextCenterY = Math.trunc((next.minChunkY + next.maxChunkY) / 2)
  return (
    Math.abs(previousCenterX - nextCenterX) >= AOI_HYSTERESIS_CHUNKS ||
    Math.abs(previousCenterY - nextCenterY) >= AOI_HYSTERESIS_CHUNKS ||
    previous.regionId !== next.regionId ||
    previous.dimensionId !== next.dimensionId
  )
}

export function buildSessionQueries(input: SessionQueryInput): string[] {
  return [
    `SELECT * FROM physics_state_v2 WHERE entity_id = 0x${input.identityHex}`,
    `SELECT * FROM server_correction_v2 WHERE identity = 0x${input.identityHex} AND region_id = ${input.regionId.toString()} AND dimension_id = ${input.dimensionId}`,
    `SELECT * FROM player_session_view WHERE identity = 0x${input.identityHex}`,
    `SELECT * FROM building_preview_feedback_view WHERE identity = 0x${input.identityHex}`,
    `SELECT * FROM npc_interaction_log WHERE caller_identity = 0x${input.identityHex}`,
    'SELECT * FROM npc_ai_status_view',
  ]
}

export function buildInventoryQueries(input: SessionQueryInput): string[] {
  return [
    `SELECT * FROM player_inventory_container_view WHERE owner_identity = 0x${input.identityHex}`,
    `SELECT * FROM player_inventory_slot_view WHERE owner_identity = 0x${input.identityHex}`,
    `SELECT * FROM player_inventory_item_view WHERE owner_identity = 0x${input.identityHex}`,
    `SELECT * FROM player_wallet_view WHERE identity = 0x${input.identityHex}`,
  ]
}

export function buildCombatQueries(regionId: bigint, dimensionId: number): string[] {
  return [`SELECT * FROM combat_hit_v2 WHERE region_id = ${regionId.toString()} AND dimension_id = ${dimensionId}`]
}

export function buildAoiQueries(window: AoiWindow, includeFootprintOverlay: boolean): string[] {
  const minHexX = window.minChunkX * DEFAULT_CHUNK_SIZE
  const maxHexX = (window.maxChunkX + 1) * DEFAULT_CHUNK_SIZE - 1
  const minHexZ = window.minChunkY * DEFAULT_CHUNK_SIZE
  const maxHexZ = (window.maxChunkY + 1) * DEFAULT_CHUNK_SIZE - 1
  const region = window.regionId.toString()
  const dimension = window.dimensionId

  const queries = [
    'SELECT * FROM world_gen_params',
    `SELECT * FROM aoi_stream_v2 WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${window.minChunkX} AND chunk_x <= ${window.maxChunkX} AND chunk_y >= ${window.minChunkY} AND chunk_y <= ${window.maxChunkY}`,
    `SELECT * FROM terrain_chunk_stream WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${window.minChunkX} AND chunk_x <= ${window.maxChunkX} AND chunk_y >= ${window.minChunkY} AND chunk_y <= ${window.maxChunkY}`,
    `SELECT * FROM terrain_chunk_payload WHERE region_id = ${region} AND dimension_id = ${dimension} AND chunk_x >= ${window.minChunkX} AND chunk_x <= ${window.maxChunkX} AND chunk_y >= ${window.minChunkY} AND chunk_y <= ${window.maxChunkY}`,
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

  return queries
}

export function hashQueries(queries: string[]): string {
  return queries.join('|')
}

function clampDimension(dimension: number): number {
  const safe = Number.isFinite(dimension) ? Math.trunc(dimension) : 1
  return safe > 0 ? safe : 1
}
