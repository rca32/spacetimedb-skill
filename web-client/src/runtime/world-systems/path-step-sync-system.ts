import {
  IsPathStep,
  NetEntity,
  PathStepData,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import {
  KnownKeyMap,
  PathStepRow,
  pruneTable,
  upsertWorldEntity,
} from './common'

export function syncPathSteps(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<PathStepRow>,
): void {
  const table = 'path_step'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.stepKey}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, PathStepData)
      entity.set(NetEntity, { table, serverId: row.stepKey })
      entity.set(WorldObjectKind, { kind: 'Path' })
      entity.set(PathStepData, {
        pathId: row.pathId,
        dimensionId: row.dimensionId,
        stepIndex: row.stepIndex,
        hexX: row.hexX,
        hexZ: row.hexZ,
      })
      entity.add(IsPathStep)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
