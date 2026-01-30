# llm_params

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
- AdminView: key, value, updated_at

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = llm_params)]
pub struct LlmParams {
  #[primary_key]
  pub key: String,
  pub value: String,
  pub updated_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW llm_params_adminview AS
SELECT key, value, updated_at
FROM llm_params
WHERE :is_admin = true;
```




## 비고
- LLM 정책/비용 파라미터.
