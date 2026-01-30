# session_state

- Access: private
- Primary Key: session_id

## RLS 규칙
- 기본: 본인 세션만 읽기. 서버 내부에서만 갱신.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자/보안 감사 계정 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: session_id, identity, region_id, last_active_at

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = session_state)]
pub struct SessionState {
  #[primary_key]
  pub session_id: u64,
  pub identity: Identity,
  pub region_id: u64,
  pub last_active_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW session_state_adminview AS
SELECT session_id, identity, region_id, last_active_at
FROM session_state
WHERE :is_admin = true;
```




## 비고
- 세션 하이재킹 방지 위해 클라 노출 금지.
