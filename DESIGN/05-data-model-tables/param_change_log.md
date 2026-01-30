# param_change_log

- Access: private
- Primary Key: change_id

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자/감사 조회.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: change_id, key, old_value, new_value, actor_id, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = param_change_log)]
pub struct ParamChangeLog {
  #[primary_key]
  pub change_id: u64,
  pub key: String,
  pub old_value: String,
  pub new_value: String,
  pub actor_id: Identity,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW param_change_log_adminview AS
SELECT change_id, key, old_value, new_value, actor_id, ts
FROM param_change_log
WHERE :is_admin = true;
```




## 비고
- 모든 변경 이력 기록.
