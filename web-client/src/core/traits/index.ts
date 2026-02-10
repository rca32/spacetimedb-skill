import { trait } from 'koota'

export type WorldObjectKindType =
  | 'Player'
  | 'Npc'
  | 'Building'
  | 'ResourceNode'
  | 'TerrainChunk'
  | 'Claim'

export const Position = trait({ x: 0, y: 0, z: 0 })
export const Rotation = trait({ x: 0, y: 0, z: 0, w: 1 })
export const Velocity = trait({ x: 0, y: 0, z: 0 })
export const PresentationTransform = trait({
  x: 0,
  y: 0,
  z: 0,
  qx: 0,
  qy: 0,
  qz: 0,
  qw: 1,
})
export const NetEntity = trait({ table: '', serverId: '' })
export const WorldObjectKind = trait({ kind: 'Player' as WorldObjectKindType })
export const ChunkData = trait({ chunkX: 0, chunkY: 0, biomeId: 0 })
export const BuildingData = trait({ state: 0, buildProgress: 0, buildRequired: 0 })
export const ResourceData = trait({ resourceType: 0, amount: 0 })

export const ThreeObjectRef = trait(() => ({
  object3d: undefined as unknown | undefined,
}))

export const IsLocalPlayer = trait()
export const IsRemotePlayer = trait()
export const IsNpc = trait()
export const IsBuilding = trait()
export const IsResourceNode = trait()
export const IsTerrainChunk = trait()
export const IsClaim = trait()
