import {
  ChunkData,
  IsTerrainChunk,
  NetEntity,
  Position,
  Rotation,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import { KnownKeyMap, TerrainChunkRow, pruneTable, upsertWorldEntity } from './common'

export function syncTerrainChunks(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<TerrainChunkRow>,
  chunkSize: number,
): void {
  const table = 'terrain_chunk_stream'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.chunkKey}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, ChunkData)
      entity.set(NetEntity, { table, serverId: row.chunkKey })
      entity.set(WorldObjectKind, { kind: 'TerrainChunk' })
      entity.set(Position, {
        x: row.chunkX * chunkSize + chunkSize * 0.5,
        y: 0,
        z: row.chunkY * chunkSize + chunkSize * 0.5,
      })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(ChunkData, {
        chunkKey: row.chunkKey,
        dimensionId: row.dimensionId,
        chunkX: row.chunkX,
        chunkY: row.chunkY,
        biomeId: row.biomeId,
        chunkSize,
        heightMin: row.heightMin,
        heightMax: row.heightMax,
        waterRatioPermille: row.waterRatioPermille,
        payloadVersion: 0,
      })
      entity.add(IsTerrainChunk)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
