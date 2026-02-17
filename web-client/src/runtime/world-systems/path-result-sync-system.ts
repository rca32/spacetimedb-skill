import {
  IsPathResult,
  NetEntity,
  PathResultData,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import {
  KnownKeyMap,
  PathResultRow,
  pruneTable,
  toKeyString,
  upsertWorldEntity,
} from './common'

export function syncPathResults(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<PathResultRow>,
): void {
  const table = 'path_result'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.pathId}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, PathResultData)
      entity.set(NetEntity, { table, serverId: row.pathId })
      entity.set(WorldObjectKind, { kind: 'Path' })
      entity.set(PathResultData, {
        pathId: row.pathId,
        requesterIdentityHex: toKeyString(row.requesterIdentity),
        regionId: row.regionId.toString(),
        startHexX: row.startHexX,
        startHexZ: row.startHexZ,
        goalHexX: row.goalHexX,
        goalHexZ: row.goalHexZ,
        status: row.status,
        stepCount: row.stepCount,
        createdAt: String(row.createdAt),
        expiresAt: String(row.expiresAt),
      })
      entity.add(IsPathResult)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
