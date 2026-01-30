# wallet

- Access: private/RLS
- Primary Key: identity

## RLS 규칙
- 기본: 본인만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: identity, balance
- AdminView: identity, balance

## 필드 마스킹 규칙
- balance는 Self/Admin에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = wallet)]
pub struct Wallet {
  #[primary_key]
  pub identity: Identity,
  pub balance: i64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW wallet_selfview AS
SELECT identity, balance
FROM wallet
WHERE identity = :viewer_identity;

-- AdminView
CREATE VIEW wallet_adminview AS
SELECT identity, balance
FROM wallet
WHERE :is_admin = true;
```





## 비고
- 잔고는 클라 캐시 최소화.
