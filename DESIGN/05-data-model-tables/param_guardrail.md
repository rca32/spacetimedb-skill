# param_guardrail

- Access: private
- Primary Key: key

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
- AdminView: key, min, max, daily_delta, weekly_delta

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = param_guardrail)]
pub struct ParamGuardrail {
  #[primary_key]
  pub key: String,
  pub min: i64,
  pub max: i64,
  pub daily_delta: i64,
  pub weekly_delta: i64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW param_guardrail_adminview AS
SELECT key, min, max, daily_delta, weekly_delta
FROM param_guardrail
WHERE :is_admin = true;
```




## 비고
- 가드레일 설정.
