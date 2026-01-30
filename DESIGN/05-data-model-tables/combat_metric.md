# combat_metric

- Access: private
- Primary Key: (region_id, day)

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
- AdminView: region_id, day, avg_ttk, death_rate

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = combat_metric)]
pub struct CombatMetric {
  #[primary_key]
  pub region_id: u64,
  #[primary_key]
  pub day: u32,
  pub avg_ttk: f32,
  pub death_rate: f32,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW combat_metric_adminview AS
SELECT region_id, day, avg_ttk, death_rate
FROM combat_metric
WHERE :is_admin = true;
```




## 비고
- 전투 지표 집계.
