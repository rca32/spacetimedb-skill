# movement_violation

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
- AdminView: violation_id, identity, reason, ts, position

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = movement_violation)]
pub struct MovementViolation {
  #[primary_key]
  pub violation_id: u64,
  pub identity: Identity,
  pub reason: String,
  pub ts: u64,
  pub position: [f32; 3],
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW movement_violation_adminview AS
SELECT violation_id, identity, reason, ts, position
FROM movement_violation
WHERE :is_admin = true;
```




## 비고
- 이동 규칙 위반.
