---
run: run-013
scope: single
created: 2026-02-08T11:22:00Z
items:
  - implement-social-chat-party-guild-core-loop
---

# Implementation Plan - run-013

## Work Item: implement-social-chat-party-guild-core-loop

### Design References
- `DESIGN/13-community-social.md`
- `DESIGN/02-systems-design.md`
- `DESIGN/05-data-model.md`

### Implementation Checklist
- 채팅: `chat_channel` 기반 메시지 전송 리듀서 + 채널별 기본 레이트 제한 추가.
- 파티: 생성/참여/탈퇴/리더 변경 리듀서 추가(파티 최대 인원 제한 포함).
- 길드: 생성/가입/역할 변경/프로젝트 진행 리듀서 추가(권한 역할 검증 포함).
- 소셜 이벤트: `social_feed` 기록 helper를 리듀서 경로에 연결.
- 구독 경로: 채팅/파티/길드 조회 query helper 추가.

### Files to Create
- `stitch-server/crates/game_server/src/reducers/social/mod.rs`
- `stitch-server/crates/game_server/src/reducers/social/chat_send_message.rs`
- `stitch-server/crates/game_server/src/reducers/social/party_create.rs`
- `stitch-server/crates/game_server/src/reducers/social/party_join.rs`
- `stitch-server/crates/game_server/src/reducers/social/party_leave.rs`
- `stitch-server/crates/game_server/src/reducers/social/party_transfer_leader.rs`
- `stitch-server/crates/game_server/src/reducers/social/guild_create.rs`
- `stitch-server/crates/game_server/src/reducers/social/guild_join.rs`
- `stitch-server/crates/game_server/src/reducers/social/guild_set_role.rs`
- `stitch-server/crates/game_server/src/reducers/social/guild_project_update.rs`
- `stitch-server/crates/game_server/src/reducers/social/helpers.rs`
- `stitch-server/crates/game_server/src/subscriptions/social_stream.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/subscriptions/mod.rs`

### Validation
- `cargo check -p game_server`
- `cargo test -p game_server subscriptions::social_stream`
- `spacetime build` (in `stitch-server/crates/game_server`)
