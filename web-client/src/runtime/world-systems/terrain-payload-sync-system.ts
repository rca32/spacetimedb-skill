import {
  ChunkPayloadData,
  IsTerrainChunkPayload,
  NetEntity,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import {
  KnownKeyMap,
  TerrainChunkPayloadRow,
  pruneTable,
  upsertWorldEntity,
} from './common'

export function syncTerrainChunkPayloads(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<TerrainChunkPayloadRow>,
): void {
  const table = 'terrain_chunk_payload'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.chunkKey}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, ChunkPayloadData)
      entity.set(NetEntity, { table, serverId: row.chunkKey })
      entity.set(WorldObjectKind, { kind: 'TerrainChunk' })
      entity.set(ChunkPayloadData, {
        chunkKey: row.chunkKey,
        payloadVersion: row.cellPayloadVersion,
        cellCount: row.cellCount,
        payloadBytes: Array.from(row.cellPayloadBytes),
      })
      entity.add(IsTerrainChunkPayload)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
