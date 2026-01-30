# npc_state

- Access: public
- Primary Key: npc_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: npc_id, region_id, role, mood
- PartyView: npc_id, region_id, role, mood
- GuildView: npc_id, region_id, role, mood
- SelfView: npc_id, region_id, role, mood, next_action_ts
- AdminView: npc_id, region_id, role, mood, next_action_ts

## 필드 마스킹 규칙
- MASK.ENUM_TOP for mood (Public/Party/Guild).
- MASK.TIME_1S for next_action_ts (Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_state, public)]
pub struct NpcState {
  #[primary_key]
  pub npc_id: u64,
  pub region_id: u64,
  pub role: u8,
  pub mood: u8,
  pub next_action_ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW npc_state_publicview AS
SELECT npc_id, region_id, role, mood
FROM npc_state
WHERE true;

-- PartyView
CREATE VIEW npc_state_partyview AS
SELECT npc_id, region_id, role, mood
FROM npc_state
WHERE true;

-- GuildView
CREATE VIEW npc_state_guildview AS
SELECT npc_id, region_id, role, mood
FROM npc_state
WHERE true;

-- SelfView
CREATE VIEW npc_state_selfview AS
SELECT npc_id, region_id, role, mood, next_action_ts
FROM npc_state
WHERE true;

-- AdminView
CREATE VIEW npc_state_adminview AS
SELECT npc_id, region_id, role, mood, next_action_ts
FROM npc_state
WHERE :is_admin = true;
```




## 비고
- 행동/쿨다운은 공개 범위 제한 가능.
- npc_id는 entity_core.entity_id와 동일하게 사용.
