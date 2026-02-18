import {
  ClaimData,
  IsClaim,
  NetEntity,
  Position,
  Rotation,
  WorldObjectKind,
} from '../../core/traits'
import { RuntimeContext } from '../types'
import {
  ClaimStateRow,
  KnownKeyMap,
  pruneTable,
  toKeyString,
  upsertWorldEntity,
} from './common'

export function syncClaims(
  ctx: RuntimeContext,
  knownKeys: KnownKeyMap,
  rows: Iterable<ClaimStateRow>,
): void {
  const table = 'claim_state'
  const seen = new Set<string>()

  for (const row of rows) {
    const key = `${table}:${row.claimId.toString()}`
    seen.add(key)

    upsertWorldEntity(ctx, key, (entity) => {
      entity.add(NetEntity, WorldObjectKind, Position, Rotation, ClaimData)
      entity.set(NetEntity, { table, serverId: row.claimId.toString() })
      entity.set(WorldObjectKind, { kind: 'Claim' })
      entity.set(Position, { x: row.centerX, y: 0, z: row.centerZ })
      entity.set(Rotation, { x: 0, y: 0, z: 0, w: 1 })
      entity.set(ClaimData, {
        radius: row.radius,
        tier: row.tier,
        ownerIdentityHex: toKeyString(row.ownerIdentity),
        totemBuildingId: toKeyString(row.totemBuildingId),
        regionId: toKeyString(row.regionId),
        dimensionId: row.dimensionId,
      })
      entity.add(IsClaim)
    })
  }

  pruneTable(ctx, knownKeys, table, seen)
}
