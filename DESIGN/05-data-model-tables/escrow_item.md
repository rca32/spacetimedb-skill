# escrow_item

- Access: private
- Primary Key: escrow_id

## RLS 규칙
- 기본: 거래 참가자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: escrow_id, item_instance_id, qty

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = escrow_item)]
pub struct EscrowItem {
  #[primary_key]
  pub escrow_id: u64,
  pub item_instance_id: u64,
  pub qty: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW escrow_item_adminview AS
SELECT escrow_id, item_instance_id, qty
FROM escrow_item
WHERE :is_admin = true;
```




## 비고
- 결제/환불 시만 참조.
