# metric_daily

- Access: private
- Primary Key: (name, day)

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
- AdminView: name, day, value

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = metric_daily)]
pub struct MetricDaily {
  #[primary_key]
  pub name: String,
  #[primary_key]
  pub day: u32,
  pub value: String,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW metric_daily_adminview AS
SELECT name, day, value
FROM metric_daily
WHERE :is_admin = true;
```




## 비고
- 일일 KPI 집계.
