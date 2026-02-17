import {
  BuildingData,
  IsBuilding,
  NetEntity,
  Position,
  Rotation,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import { BuildingStateRow, KnownKeyMap, pruneTable, upsertWorldEntity } from './common'

export function syncBuildingState(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<BuildingStateRow>,
): void {
  const table = 'building_state'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.entityId.toString()}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, BuildingData)
      entity.set(NetEntity, { table, serverId: row.entityId.toString() })
      entity.set(WorldObjectKind, { kind: 'Building' })
      entity.set(Position, { x: row.hexX, y: 0, z: row.hexZ })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(BuildingData, {
        state: row.state,
        buildProgress: row.buildProgress,
        buildRequired: row.buildRequired,
        requiredItemDefId: row.requiredItemDefId.toString(),
      })
      entity.add(IsBuilding)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
