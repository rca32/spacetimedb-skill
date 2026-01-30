# price_index

- Access: public
- Primary Key: (item_def_id, ts)

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: item_def_id, ts, price_avg, volume
- PartyView: item_def_id, ts, price_avg, volume
- GuildView: item_def_id, ts, price_avg, volume
- SelfView: item_def_id, ts, price_avg, volume
- AdminView: item_def_id, ts, price_avg, volume

## 필드 마스킹 규칙
- MASK.TIME_1H on ts (Public).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = price_index, public)]
pub struct PriceIndex {
  #[primary_key]
  pub item_def_id: u64,
  #[primary_key]
  pub ts: u64,
  pub price_avg: f64,
  pub volume: u64,
}
```

```sql
-- PublicView
CREATE VIEW price_index_publicview AS
SELECT item_def_id, ts, price_avg, volume
FROM price_index
WHERE true;

-- PartyView
CREATE VIEW price_index_partyview AS
SELECT item_def_id, ts, price_avg, volume
FROM price_index
WHERE true;

-- GuildView
CREATE VIEW price_index_guildview AS
SELECT item_def_id, ts, price_avg, volume
FROM price_index
WHERE true;

-- SelfView
CREATE VIEW price_index_selfview AS
SELECT item_def_id, ts, price_avg, volume
FROM price_index
WHERE true;

-- AdminView
CREATE VIEW price_index_adminview AS
SELECT item_def_id, ts, price_avg, volume
FROM price_index
WHERE :is_admin = true;
```




## 비고
- 집계 지표만 공개.
