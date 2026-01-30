# trade_session

- Access: private/RLS
- Primary Key: session_id

## RLS 규칙
- 기본: 거래 참가자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: session_id, a_id, b_id, status, timeout_ts
- AdminView: session_id, a_id, b_id, status, timeout_ts

## 필드 마스킹 규칙
- a_id/b_id는 Self/Admin에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = trade_session)]
pub struct TradeSession {
  #[primary_key]
  pub session_id: u64,
  pub a_id: Identity,
  pub b_id: Identity,
  pub status: u8,
  pub timeout_ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW trade_session_selfview AS
SELECT session_id, a_id, b_id, status, timeout_ts
FROM trade_session
WHERE a_id = :viewer_entity_id OR b_id = :viewer_entity_id;

-- AdminView
CREATE VIEW trade_session_adminview AS
SELECT session_id, a_id, b_id, status, timeout_ts
FROM trade_session
WHERE :is_admin = true;
```




## 비고
- 시간 초과 시 자동 종료.
