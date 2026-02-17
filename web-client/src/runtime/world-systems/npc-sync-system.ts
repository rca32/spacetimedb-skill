import {
  IsNpc,
  NetEntity,
  Position,
  PresentationTransform,
  Rotation,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import { KnownKeyMap, NpcStateRow, pruneTable, upsertWorldEntity } from './common'

export function syncNpcState(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<NpcStateRow>,
): void {
  const table = 'npc_state'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.npcId.toString()}`
    seen.add(key)
    const targetPos = { x: row.hexX, y: 0, z: row.hexZ }

    upsertWorldEntity(ctx, key, (entity, isNew) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, PresentationTransform)
      entity.set(NetEntity, { table, serverId: row.npcId.toString() })
      entity.set(WorldObjectKind, { kind: 'Npc' })
      entity.set(Position, targetPos)
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.add(IsNpc)

      if (isNew) {
        entity.set(PresentationTransform, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
        })
      } else if (!entity.has(PresentationTransform)) {
        entity.set(PresentationTransform, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          qx: 0,
          qy: 0,
          qz: 0,
          qw: 1,
        })
      }
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
