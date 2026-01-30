# building_state

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: 건물 기본 정보는 공개. 내부/권한 정보는 RLS 제한.
- 파티 예외: 클레임/파티 권한이 있으면 상세 정보 공개.
- 길드 예외: 길드 권한이 있으면 상세 정보 공개.
- 운영자/GM 예외: 운영자 전체 조회 가능.


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
WHERE EXISTS (SELECT 1 FROM permission_state ps WHERE ps.target_id = building_state.entity_id AND ps.subject_id = :viewer_entity_id AND (ps.flags & :perm_view) <> 0);

-- GuildView
CREATE VIEW building_state_guildview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE EXISTS (SELECT 1 FROM permission_state ps WHERE ps.target_id = building_state.entity_id AND ps.subject_id = :viewer_entity_id AND (ps.flags & :perm_view) <> 0);

-- SelfView
CREATE VIEW building_state_selfview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE owner_id = :viewer_entity_id OR EXISTS (SELECT 1 FROM permission_state ps WHERE ps.target_id = building_state.entity_id AND ps.subject_id = :viewer_entity_id AND (ps.flags & :perm_owner) <> 0);

-- AdminView
CREATE VIEW building_state_adminview AS
SELECT entity_id, owner_id, durability, state
FROM building_state
WHERE :is_admin = true;
```




## 비고
- 실제 권한은 permission_state로 검증.
