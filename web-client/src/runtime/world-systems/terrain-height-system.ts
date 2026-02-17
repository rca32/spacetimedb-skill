import {
  ChunkData,
  ChunkPayloadData,
  IsLocalPlayer,
  IsNpc,
  IsRemotePlayer,
  IsTerrainChunk,
  IsTerrainChunkPayload,
  Position,
  PresentationTransform,
} from '../../core/traits'
import { CoreWorld } from '../../core/world'

const TERRAIN_PAYLOAD_VERSION_V1 = 1
const TERRAIN_HEIGHT_SCALE = 0.2
const TERRAIN_SEA_LEVEL_BASE = 12

type ChunkMeta = {
  chunkKey: string
  chunkX: number
  chunkY: number
  chunkSize: number
}

type ChunkPayload = {
  payloadVersion: number
  cellCount: number
  payloadBytes: number[]
}

export function snapActorPresentationToTerrain(world: CoreWorld): number | null {
  const byChunkCoord = new Map<string, ChunkMeta>()
  const payloadByChunkKey = new Map<string, ChunkPayload>()
  let primaryChunkSize: number | null = null

  world.ecs.query(IsTerrainChunk, ChunkData).readEach(([chunk]) => {
    const meta: ChunkMeta = {
      chunkKey: chunk.chunkKey,
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      chunkSize: chunk.chunkSize,
    }
    if (primaryChunkSize === null && chunk.chunkSize > 0) {
      primaryChunkSize = chunk.chunkSize
    }
    byChunkCoord.set(chunkCoordKey(chunk.chunkX, chunk.chunkY), meta)
  })

  world.ecs.query(IsTerrainChunkPayload, ChunkPayloadData).readEach(([payload]) => {
    payloadByChunkKey.set(payload.chunkKey, {
      payloadVersion: payload.payloadVersion,
      cellCount: payload.cellCount,
      payloadBytes: payload.payloadBytes,
    })
  })

  const sampleAt = (x: number, z: number): number | null =>
    sampleTerrainHeightAtWorld(x, z, primaryChunkSize, byChunkCoord, payloadByChunkKey)

  world.ecs.query(IsRemotePlayer, Position, PresentationTransform).updateEach(([pos, presentation]) => {
    const y = sampleAt(pos.x, pos.z)
    if (y !== null) {
      presentation.y = y
    }
  })

  world.ecs.query(IsNpc, Position, PresentationTransform).updateEach(([pos, presentation]) => {
    const y = sampleAt(pos.x, pos.z)
    if (y !== null) {
      presentation.y = y
    }
  })

  let localY: number | null = null
  world.ecs.query(IsLocalPlayer, Position, PresentationTransform).updateEach(([pos, presentation]) => {
    const y = sampleAt(pos.x, pos.z)
    if (y !== null) {
      presentation.y = y
      localY = y
    }
  })

  return localY
}

function sampleTerrainHeightAtWorld(
  x: number,
  z: number,
  chunkSize: number | null,
  byChunkCoord: Map<string, ChunkMeta>,
  payloadByChunkKey: Map<string, ChunkPayload>,
): number | null {
  if (chunkSize === null || chunkSize <= 0) {
    return null
  }

  const chunkX = Math.floor(x / chunkSize)
  const chunkY = Math.floor(z / chunkSize)
  const meta = byChunkCoord.get(chunkCoordKey(chunkX, chunkY))
  if (!meta || meta.chunkSize <= 0) {
    return null
  }

  const chunkOriginX = meta.chunkX * meta.chunkSize
  const chunkOriginY = meta.chunkY * meta.chunkSize
  const localX = clampInt(Math.floor(x - chunkOriginX), 0, meta.chunkSize - 1)
  const localY = clampInt(Math.floor(z - chunkOriginY), 0, meta.chunkSize - 1)

  const payload = payloadByChunkKey.get(meta.chunkKey)
  if (!payload || payload.payloadVersion !== TERRAIN_PAYLOAD_VERSION_V1) {
    return null
  }

  const expectedCells = meta.chunkSize * meta.chunkSize
  if (payload.cellCount > 0 && payload.cellCount !== expectedCells) {
    return null
  }

  const index = (localY * meta.chunkSize + localX) * 8
  if (index + 1 >= payload.payloadBytes.length) {
    return null
  }

  const elevation = readInt16Le(payload.payloadBytes, index)
  return (elevation - TERRAIN_SEA_LEVEL_BASE) * TERRAIN_HEIGHT_SCALE
}

function readInt16Le(bytes: number[], offset: number): number {
  const lo = bytes[offset] ?? 0
  const hi = bytes[offset + 1] ?? 0
  const value = ((hi & 0xff) << 8) | (lo & 0xff)
  return value & 0x8000 ? value - 0x1_0000 : value
}

function chunkCoordKey(chunkX: number, chunkY: number): string {
  return `${chunkX}:${chunkY}`
}

function clampInt(value: number, min: number, max: number): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}
