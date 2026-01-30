# audit_log

- Access: private
- Primary Key: audit_id

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자/감사 계정 조회.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: audit_id, actor_id, action, payload, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = audit_log)]
pub struct AuditLog {
  #[primary_key]
  pub audit_id: u64,
  pub actor_id: Identity,
  pub action: String,
  pub payload: String,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW audit_log_adminview AS
SELECT audit_id, actor_id, action, payload, ts
FROM audit_log
WHERE :is_admin = true;
```




## 비고
- 민감 데이터 마스킹.
