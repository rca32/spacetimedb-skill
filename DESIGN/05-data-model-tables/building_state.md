# building_state

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: 기본 상태는 공개.
- 권한 기반 뷰: 파티/길드/본인 뷰는 `permission_state.flags`에서 `perm_view` 또는 `perm_owner`를 만족해야 한다.
- 운영자 예외: `AdminView`에서만 전체 조회 허용.
- 민감 필드 확장 시 `PublicView`에는 추가하지 않고 권한 뷰에만 추가한다.


## 뷰/필드 노출 스펙
- PublicView: entity_id, owner_id, durability, state
- PartyView: entity_id, owner_id, durability, state
- GuildView: entity_id, owner_id, durability, state
- SelfView: entity_id, owner_id, durability, state
- AdminView: entity_id, owner_id, durability, state

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = building_state, public)]
pub struct BuildingState {
  #[primary_key]
  pub entity_id: u64,
  pub owner_id: u64,
  pub durability: u32,
  pub state: u8,
}
```

```sql
-- PublicView
CREATE VIEW building_state_publicview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE true;

-- PartyView
CREATE VIEW building_state_partyview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE EXISTS (
  SELECT 1
  FROM permission_state ps
  WHERE ps.target_id = building_state.entity_id
    AND ps.subject_type = 2
    AND ps.subject_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)
    AND ((ps.flags & :perm_view) <> 0 OR (ps.flags & :perm_owner) <> 0)
);

-- GuildView
CREATE VIEW building_state_guildview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE EXISTS (
  SELECT 1
  FROM permission_state ps
  WHERE ps.target_id = building_state.entity_id
    AND ps.subject_type = 3
    AND ps.subject_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)
    AND ((ps.flags & :perm_view) <> 0 OR (ps.flags & :perm_owner) <> 0)
);

-- SelfView
CREATE VIEW building_state_selfview AS
SELECT entity_id, owner_id, durability, state
FROM building_state b
WHERE b.owner_id = :viewer_entity_id
   OR EXISTS (
     SELECT 1
     FROM permission_state ps
     WHERE ps.target_id = b.entity_id
       AND (
         (ps.subject_type = 1 AND ps.subject_id = :viewer_entity_id) OR
         (ps.subject_type = 2 AND ps.subject_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)) OR
         (ps.subject_type = 3 AND ps.subject_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id))
       )
       AND (ps.flags & :perm_owner) <> 0
   );

-- AdminView
CREATE VIEW building_state_adminview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE :is_admin = true;
```




## 비고
- 변경 reducer(배치/철거/수리)는 mutate 전에 `permission_check(target=building_id)`를 호출한다.
- `perm_owner`는 `perm_admin`보다 우선하며 소유자 전용 액션 판정에 사용한다.
