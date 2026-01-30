# npc_action_result

- Access: private
- Primary Key: request_id

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
- AdminView: request_id, status, applied_ts

## 필드 마스킹 규칙
- 전체 필드는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_action_result)]
pub struct NpcActionResult {
  #[primary_key]
  pub request_id: u64,
  pub status: u8,
  pub applied_ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW npc_action_result_adminview AS
SELECT request_id, status, applied_ts
FROM npc_action_result
WHERE :is_admin = true;
```




## 비고
- 결과 상태만 기록.
