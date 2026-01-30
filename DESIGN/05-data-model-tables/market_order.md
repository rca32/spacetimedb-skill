# market_order

- Access: public/RLS
- Primary Key: order_id

## RLS 규칙
- 기본: 가격/수량/아이템은 공개. 소유자 identity는 마스킹.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: order_id, order_type, item_def_id, price, qty
- PartyView: order_id, order_type, item_def_id, price, qty
- GuildView: order_id, order_type, item_def_id, price, qty
- SelfView: order_id, order_type, item_def_id, price, qty, owner
- AdminView: order_id, order_type, item_def_id, price, qty, owner

## 필드 마스킹 규칙
- MASK.ID_HASH for owner (Public/Party/Guild).
- MASK.PRICE_TICK for price (Public/Party/Guild).
- MASK.QTY_LOT for qty (Public/Party/Guild).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = market_order, public)]
pub struct MarketOrder {
  #[primary_key]
  pub order_id: u64,
  pub order_type: u8,
  pub item_def_id: u64,
  pub price: u64,
  pub qty: u64,
  pub owner: Identity,
}
```

```sql
-- PublicView
CREATE VIEW market_order_publicview AS
SELECT order_id, order_type, item_def_id, price, qty
FROM market_order
WHERE true;

-- PartyView
CREATE VIEW market_order_partyview AS
SELECT order_id, order_type, item_def_id, price, qty
FROM market_order
WHERE true;

-- GuildView
CREATE VIEW market_order_guildview AS
SELECT order_id, order_type, item_def_id, price, qty
FROM market_order
WHERE true;

-- SelfView
CREATE VIEW market_order_selfview AS
SELECT order_id, order_type, item_def_id, price, qty, owner
FROM market_order
WHERE owner = :viewer_identity;

-- AdminView
CREATE VIEW market_order_adminview AS
SELECT order_id, order_type, item_def_id, price, qty, owner
FROM market_order
WHERE :is_admin = true;
```




## 비고
- owner 식별은 서버에서만.
