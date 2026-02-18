import {
  IsResourceNode,
  NetEntity,
  Position,
  ResourceData,
  Rotation,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import { KnownKeyMap, ResourceNodeRow, pruneTable, upsertWorldEntity } from './common'

export function syncResourceState(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<ResourceNodeRow>,
): void {
  const table = 'resource_node'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.entityId.toString()}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, ResourceData)
      entity.set(NetEntity, { table, serverId: row.entityId.toString() })
      entity.set(WorldObjectKind, { kind: 'ResourceNode' })
      entity.set(Position, { x: row.hexX, y: 0, z: row.hexZ })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(ResourceData, {
        dimensionId: row.dimensionId,
        resourceType: row.resourceType,
        amount: row.amount,
        maxAmount: row.maxAmount,
        isDepleted: row.isDepleted,
      })
      entity.add(IsResourceNode)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
