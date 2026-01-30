# claim_state

- Access: public
- Primary Key: claim_id

## RLS 규칙
- 기본: 클레임 기본 정보는 공개.
- 파티 예외: 클레임 멤버 파티는 세부 권한 조회 가능.
- 길드 예외: 길드 멤버는 세부 권한 조회 가능.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: claim_id, owner_id, region_id, tier
- PartyView: claim_id, owner_id, region_id, tier
- GuildView: claim_id, owner_id, region_id, tier
- SelfView: claim_id, owner_id, region_id, tier
- AdminView: claim_id, owner_id, region_id, tier

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = claim_state, public)]
pub struct ClaimState {
  #[primary_key]
  pub claim_id: u64,
  pub owner_id: u64,
  pub region_id: u64,
  pub tier: u32,
}
```

```sql
-- PublicView
CREATE VIEW claim_state_publicview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE true;

-- PartyView
CREATE VIEW claim_state_partyview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE EXISTS (SELECT 1 FROM permission_state ps WHERE ps.target_id = claim_state.claim_id AND ps.subject_id = :viewer_entity_id AND (ps.flags & :perm_view) <> 0);

-- GuildView
CREATE VIEW claim_state_guildview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE EXISTS (SELECT 1 FROM permission_state ps WHERE ps.target_id = claim_state.claim_id AND ps.subject_id = :viewer_entity_id AND (ps.flags & :perm_view) <> 0);

-- SelfView
CREATE VIEW claim_state_selfview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE owner_id = :viewer_entity_id OR EXISTS (SELECT 1 FROM permission_state ps WHERE ps.target_id = claim_state.claim_id AND ps.subject_id = :viewer_entity_id AND (ps.flags & :perm_owner) <> 0);

-- AdminView
CREATE VIEW claim_state_adminview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE :is_admin = true;
```




## 비고
- 정밀 권한은 permission_state 사용.
