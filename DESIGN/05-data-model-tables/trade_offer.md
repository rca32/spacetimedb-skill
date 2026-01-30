# trade_offer

- Access: private/RLS
- Primary Key: (session_id, item_instance_id)

## RLS 규칙
- 기본: 거래 참가자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: session_id, item_instance_id, qty
- AdminView: session_id, item_instance_id, qty

## 필드 마스킹 규칙
- item_instance_id는 Self/Admin에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = trade_offer)]
pub struct TradeOffer {
  #[primary_key]
  pub session_id: u64,
  #[primary_key]
  pub item_instance_id: u64,
  pub qty: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW trade_offer_selfview AS
SELECT session_id, item_instance_id, qty
FROM trade_offer
WHERE session_id IN (SELECT session_id FROM trade_session WHERE a_id = :viewer_entity_id OR b_id = :viewer_entity_id);

-- AdminView
CREATE VIEW trade_offer_adminview AS
SELECT session_id, item_instance_id, qty
FROM trade_offer
WHERE :is_admin = true;
```




## 비고
- 거래 상대에게는 요약 필드만.
