# npc_cost_metrics

- Access: private
- Primary Key: session_id

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
- AdminView: session_id, token_in, token_out, latency_ms, route_tier

## 필드 마스킹 규칙
- MASK.REDACT for token_in/out/latency_ms (non-admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_cost_metrics)]
pub struct NpcCostMetrics {
  #[primary_key]
  pub session_id: u64,
  pub token_in: u64,
  pub token_out: u64,
  pub latency_ms: u32,
  pub route_tier: u8,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW npc_cost_metrics_adminview AS
SELECT session_id, token_in, token_out, latency_ms, route_tier
FROM npc_cost_metrics
WHERE :is_admin = true;
```




## 비고
- 비용/지연 지표.
