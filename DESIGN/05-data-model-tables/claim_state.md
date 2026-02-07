# claim_state

- Access: public
- Primary Key: claim_id

## RLS 규칙
- 기본: 클레임 기본 정보는 공개.
- 권한 기반 뷰: 파티/길드/본인 뷰는 `permission_state.flags`에서 `perm_view` 또는 `perm_owner`를 만족해야 한다.
- 운영자 예외: `AdminView`에서만 전체 조회 허용.
- 민감 필드는 `PublicView`에 직접 노출하지 않는다.


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
WHERE EXISTS (
  SELECT 1
  FROM permission_state ps
  WHERE ps.target_id = claim_state.claim_id
    AND ps.subject_type = 2
    AND ps.subject_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)
    AND ((ps.flags & :perm_view) <> 0 OR (ps.flags & :perm_owner) <> 0)
);

-- GuildView
CREATE VIEW claim_state_guildview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE EXISTS (
  SELECT 1
  FROM permission_state ps
  WHERE ps.target_id = claim_state.claim_id
    AND ps.subject_type = 3
    AND ps.subject_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)
    AND ((ps.flags & :perm_view) <> 0 OR (ps.flags & :perm_owner) <> 0)
);

-- SelfView
CREATE VIEW claim_state_selfview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state c
WHERE c.owner_id = :viewer_entity_id
   OR EXISTS (
     SELECT 1
     FROM permission_state ps
     WHERE ps.target_id = c.claim_id
       AND (
         (ps.subject_type = 1 AND ps.subject_id = :viewer_entity_id) OR
         (ps.subject_type = 2 AND ps.subject_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)) OR
         (ps.subject_type = 3 AND ps.subject_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id))
       )
       AND (ps.flags & :perm_owner) <> 0
   );

-- AdminView
CREATE VIEW claim_state_adminview AS
SELECT claim_id, owner_id, region_id, tier
FROM claim_state
WHERE :is_admin = true;
```




## 비고
- 변경 reducer(클레임 정책/멤버/확장)는 mutate 전에 `permission_check(target=claim_id)`를 호출한다.
- 조회 정책은 `building_state`와 동일한 패턴으로 유지해 문서 간 일관성을 보장한다.
