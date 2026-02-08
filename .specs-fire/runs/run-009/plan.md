---
run: run-009
scope: single
created: 2026-02-08T09:52:30Z
items:
  - establish-extended-schema-for-liveops-social-security-domains
---

# Implementation Plan - run-009

## Work Item: establish-extended-schema-for-liveops-social-security-domains

### Approach
- `src/tables`에 누락된 라이브옵스/소셜/보안/경제/월드/진행 상태 테이블을 도메인별 모듈로 추가.
- 기존 코어 테이블과 충돌하지 않도록 신규 모듈을 `tables/mod.rs`에 등록하고 re-export 정리.
- 접근 경계는 설계 기준에 맞춰 `public/private`를 분리.

### Files to Create
- `stitch-server/crates/game_server/src/tables/account_profile.rs`
- `stitch-server/crates/game_server/src/tables/role_binding.rs`
- `stitch-server/crates/game_server/src/tables/live_ops.rs`
- `stitch-server/crates/game_server/src/tables/social.rs`
- `stitch-server/crates/game_server/src/tables/economy.rs`
- `stitch-server/crates/game_server/src/tables/world_state.rs`
- `stitch-server/crates/game_server/src/tables/player_progression.rs`
- `stitch-server/crates/game_server/src/tables/ops_moderation.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/tables/mod.rs`

### Validation
- `cargo check -p game_server`
