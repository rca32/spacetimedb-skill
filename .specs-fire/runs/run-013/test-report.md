---
run: run-013
generated: 2026-02-08T11:40:00Z
status: passed
---

# Test Report - run-013

## Environment
- Module: `stitch-server/crates/game_server`
- Commands:
  - `cargo check -p game_server`
  - `cargo test -p game_server social_stream -- --nocapture`
  - `spacetime build`

## Work Item: implement-social-chat-party-guild-core-loop

### Test Results
- Passed: yes
- Failed: 0
- Skipped: 0

### Acceptance Criteria Validation
- 채팅 채널 송수신과 기본 레이트 제한: `chat_send_message` + `rate_limit_bucket` 연동으로 구현.
- 파티 생성/참여/탈퇴/리더 변경: `party_create`, `party_join`, `party_leave`, `party_transfer_leader`로 구현.
- 길드 생성/가입/역할/프로젝트 상태: `guild_create`, `guild_join`, `guild_set_role`, `guild_project_update`로 구현.

## Notes
- `wasm-opt` 미설치 경고가 있으나 모듈 빌드는 정상 완료.
