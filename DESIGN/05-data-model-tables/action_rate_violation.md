# action_rate_violation

- Access: private
- Primary Key: violation_id

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: violation_id, identity, action, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = action_rate_violation)]
pub struct ActionRateViolation {
  #[primary_key]
  pub violation_id: u64,
  pub identity: Identity,
  pub action: u8,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW action_rate_violation_adminview AS
SELECT violation_id, identity, action, ts
FROM action_rate_violation
WHERE :is_admin = true;
```




## 비고
- 행동 빈도 위반.
