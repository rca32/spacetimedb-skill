# action_state

- Access: public/RLS
- Primary Key: entity_id

## RLS 규칙
- 기본: 본인 전체. 타인은 action_type만 공개.
- 파티 예외: 파티 멤버는 진행률/쿨다운 요약 공개.
- 길드 예외: 길드 멤버는 기본 공개 수준.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, action_type
- PartyView: entity_id, action_type, progress
- GuildView: entity_id, action_type
- SelfView: entity_id, action_type, progress, cooldown_ts
- AdminView: entity_id, action_type, progress, cooldown_ts

## 필드 마스킹 규칙
- MASK.PCT_10 for action_progress (Party/Self).
- MASK.TIME_1S for cooldown_ts (Self/Admin only).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = action_state, public)]
pub struct ActionState {
  #[primary_key]
  pub entity_id: u64,
  pub action_type: u8,
  pub progress: u32,
  pub cooldown_ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW action_state_publicview AS
SELECT entity_id, action_type
FROM action_state
WHERE true;

-- PartyView
CREATE VIEW action_state_partyview AS
SELECT entity_id, action_type, progress
FROM action_state
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id = action_state.entity_id AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW action_state_guildview AS
SELECT entity_id, action_type
FROM action_state
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id = action_state.entity_id AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW action_state_selfview AS
SELECT entity_id, action_type, progress, cooldown_ts
FROM action_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW action_state_adminview AS
SELECT entity_id, action_type, progress, cooldown_ts
FROM action_state
WHERE :is_admin = true;
```




## 비고
- 치트 방지 위해 상세 타이밍 정보 제한.
