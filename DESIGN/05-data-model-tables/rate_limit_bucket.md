# rate_limit_bucket

- Access: private
- Primary Key: (identity, action_type)

## RLS 규칙
- 기본: 내부 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: identity, action_type, count, window_ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = rate_limit_bucket)]
pub struct RateLimitBucket {
  #[primary_key]
  pub identity: Identity,
  #[primary_key]
  pub action_type: u8,
  pub count: u32,
  pub window_ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW rate_limit_bucket_adminview AS
SELECT identity, action_type, count, window_ts
FROM rate_limit_bucket
WHERE :is_admin = true;
```




## 비고
- 치트 탐지 보조 데이터.
