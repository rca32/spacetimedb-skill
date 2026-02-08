# player_session_view

- Access: public
- Primary Key: identity

## RLS 규칙
- 본 테이블은 `session_state` private 원본에서 서버가 동기화하는 projection이다.
- 클라이언트는 원본 대신 본 view만 구독한다.

## 스키마 (서버 구현 기준)
```rust
#[spacetimedb::table(name = player_session_view, public)]
pub struct PlayerSessionView {
  #[primary_key]
  pub identity: Identity,
  pub region_id: u64,
  pub last_active_at: Timestamp,
}
```

## 비고
- 동기화 시점: `sign_in`, `sign_out`.
