# order_fill

- Access: private
- Primary Key: fill_id

## RLS 규칙
- 기본: 거래 당사자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: order_id, fill_qty, fill_price, ts
- AdminView: fill_id, order_id, fill_qty, fill_price, ts

## 필드 마스킹 규칙
- fill_id는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = order_fill)]
pub struct OrderFill {
  #[primary_key]
  pub fill_id: u64,
  pub order_id: u64,
  pub fill_qty: u64,
  pub fill_price: u64,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW order_fill_selfview AS
SELECT order_id, fill_qty, fill_price, ts
FROM order_fill
WHERE order_id IN (SELECT order_id FROM market_order WHERE owner = :viewer_identity);

-- AdminView
CREATE VIEW order_fill_adminview AS
SELECT fill_id, order_id, fill_qty, fill_price, ts
FROM order_fill
WHERE :is_admin = true;
```




## 비고
- 정산/환불 로그.
