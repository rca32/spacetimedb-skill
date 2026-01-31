# npc_action_schedule

- Access: private
- Primary Key: npc_id

## RLS 규칙
- 기본: 서버 내부 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: npc_id, next_action_at, action_type, target_region_id

## 필드 마스킹 규칙
- next_action_at은 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_action_schedule)]
pub struct NpcActionSchedule {
  #[primary_key]
  pub npc_id: u64,
  pub next_action_at: u64,
  pub action_type: u8,
  pub target_region_id: Option<u64>,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW npc_action_schedule_adminview AS
SELECT npc_id, next_action_at, action_type, target_region_id
FROM npc_action_schedule
WHERE :is_admin = true;
```




## 비고
- 스케줄은 에이전트에서만 갱신.
