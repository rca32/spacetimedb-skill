# economy_metric

- Access: private
- Primary Key: (item_def_id, day)

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
- AdminView: item_def_id, day, price_avg, volume

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = economy_metric)]
pub struct EconomyMetric {
  #[primary_key]
  pub item_def_id: u64,
  #[primary_key]
  pub day: u32,
  pub price_avg: f64,
  pub volume: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW economy_metric_adminview AS
SELECT item_def_id, day, price_avg, volume
FROM economy_metric
WHERE :is_admin = true;
```




## 비고
- 경제 지표 집계.
