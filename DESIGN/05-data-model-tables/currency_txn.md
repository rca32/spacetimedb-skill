# currency_txn

- Access: private
- Primary Key: txn_id

## RLS 규칙
- 기본: 본인만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자/감사 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: txn_id, amount, reason, ts
- AdminView: txn_id, identity, amount, reason, ts

## 필드 마스킹 규칙
- MASK.REASON_CODE for reason (Self).
- MASK.TIME_1M for ts (Self).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = currency_txn)]
pub struct CurrencyTxn {
  #[primary_key]
  pub txn_id: u64,
  pub identity: Identity,
  pub amount: i64,
  pub reason: String,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW currency_txn_selfview AS
SELECT txn_id, amount, reason, ts
FROM currency_txn
WHERE identity = :viewer_identity;

-- AdminView
CREATE VIEW currency_txn_adminview AS
SELECT txn_id, identity, amount, reason, ts
FROM currency_txn
WHERE :is_admin = true;
```





## 비고
- 개인정보 마스킹.
