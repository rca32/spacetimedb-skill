export type TraitKey =
  | 'Position'
  | 'Rotation'
  | 'Velocity'
  | 'NetEntity'
  | 'PresentationTransform'
  | 'IsLocalPlayer'
  | 'IsRemotePlayer'
  | 'IsNpc'
  | 'IsBuilding'

// Phase 1에서는 trait key 상수만 선언하고,
// Phase 3에서 koota trait() 정의로 치환한다.
export const Trait = {
  Position: 'Position',
  Rotation: 'Rotation',
  Velocity: 'Velocity',
  NetEntity: 'NetEntity',
  PresentationTransform: 'PresentationTransform',
  IsLocalPlayer: 'IsLocalPlayer',
  IsRemotePlayer: 'IsRemotePlayer',
  IsNpc: 'IsNpc',
  IsBuilding: 'IsBuilding',
} as const satisfies Record<TraitKey, TraitKey>
