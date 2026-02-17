import {
  IsLocalPlayer,
  IsRemotePlayer,
  NetEntity,
  Position,
  PresentationTransform,
  Rotation,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import {
  KnownKeyMap,
  TransformStateRow,
  normalizeIdentityHex,
  pruneTable,
  quatFromArray,
  toKeyString,
  upsertWorldEntity,
  vec3FromArray,
} from './common'

export function syncTransformState(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<TransformStateRow>,
  localIdentityHex: string | null,
): { x: number; y: number; z: number } | null {
  const table = 'transform_state'
  const seen = new Set<string>()
  let localPos: { x: number; y: number; z: number } | null = null

  for (const row of rows) {
    const entityHex = toKeyString(row.entityId)
    const normalizedEntityHex = normalizeIdentityHex(entityHex)
    const key = `${table}:${entityHex}`
    seen.add(key)
    const isLocal = localIdentityHex !== null && normalizedEntityHex === localIdentityHex

    upsertWorldEntity(ctx, key, (entity, isNew) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, PresentationTransform)
      entity.set(NetEntity, { table, serverId: entityHex })
      entity.set(WorldObjectKind, { kind: 'Player' })
      const rowPos = vec3FromArray(row.position)
      const rowRot = quatFromArray(row.rotation)

      if (isNew) {
        entity.set(Position, rowPos)
        entity.set(Rotation, rowRot)
        entity.set(PresentationTransform, {
          x: rowPos.x,
          y: rowPos.y,
          z: rowPos.z,
          qx: rowRot.x,
          qy: rowRot.y,
          qz: rowRot.z,
          qw: rowRot.w,
        })
      } else if (!isLocal) {
        entity.set(Position, rowPos)
        entity.set(Rotation, rowRot)
      }

      if (isLocal) {
        entity.add(IsLocalPlayer)
        if (entity.has(IsRemotePlayer)) {
          entity.remove(IsRemotePlayer)
        }
        const localPosition = entity.get(Position)
        localPos = {
          x: localPosition?.x ?? rowPos.x,
          y: localPosition?.y ?? rowPos.y,
          z: localPosition?.z ?? rowPos.z,
        }
      } else {
        entity.add(IsRemotePlayer)
        if (entity.has(IsLocalPlayer)) {
          entity.remove(IsLocalPlayer)
        }
      }
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
  return localPos
}
