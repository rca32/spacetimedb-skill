# player_movement_feedback_view

- Access: public
- Primary Key: request_key (`{identity}:{request_id}`)

## RLS 규칙
- 본 테이블은 `movement_request_log`, `movement_violation`, `transform_state`를 기반으로 서버가 동기화하는 projection이다.
- 클라이언트는 이동 승인/거절 결과를 본 view로만 소비한다.

## 스키마 (서버 구현 기준)
```rust
#[spacetimedb::table(name = player_movement_feedback_view, public)]
pub struct PlayerMovementFeedbackView {
  #[primary_key]
  pub request_key: String,
  pub identity: Identity,
  pub request_id: String,
  pub accepted: bool,
  pub reason_code: String,
  pub server_pos: Vec<f32>,
  pub processed_at: Timestamp,
}
```

## 비고
- 동기화 시점: `move_to`, `anti_cheat::log_movement_violation`.
