# npc_policy_violation

- Access: private
- Primary Key: violation_id

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회/변경.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: violation_id, session_id, reason, severity, ts

## 필드 마스킹 규칙
- 전체 필드는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_policy_violation)]
pub struct NpcPolicyViolation {
  #[primary_key]
  pub violation_id: u64,
  pub session_id: u64,
  pub reason: String,
  pub severity: u8,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW npc_policy_violation_adminview AS
SELECT violation_id, session_id, reason, severity, ts
FROM npc_policy_violation
WHERE :is_admin = true;
```




## 비고
- 정책 위반 감사.
