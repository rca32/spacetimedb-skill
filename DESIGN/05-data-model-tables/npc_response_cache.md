# npc_response_cache

- Access: private
- Primary Key: cache_key

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
- AdminView: cache_key, response_summary, ttl

## 필드 마스킹 규칙
- response_summary는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_response_cache)]
pub struct NpcResponseCache {
  #[primary_key]
  pub cache_key: String,
  pub response_summary: String,
  pub ttl: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW npc_response_cache_adminview AS
SELECT cache_key, response_summary, ttl
FROM npc_response_cache
WHERE :is_admin = true;
```




## 비고
- TTL 기반 응답 캐시.
