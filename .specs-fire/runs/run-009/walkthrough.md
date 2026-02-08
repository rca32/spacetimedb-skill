---
run: run-009
work_item: establish-extended-schema-for-liveops-social-security-domains
intent: stitch-server-gap-closure-phase2
generated: 2026-02-08T10:05:00Z
mode: validate
---

# Implementation Walkthrough: 라이브옵스/소셜/보안 도메인 확장 스키마 정립

## Summary
`game_server`의 `tables/`에 누락된 핵심 도메인 스키마를 추가했다. 라이브옵스 파라미터, 소셜, 운영/중재, 경제, 월드 상태, 플레이어 진행/상태효과 테이블을 도메인 모듈로 분리해 후속 reducer 구현의 기반을 마련했다.

## Files Changed

### Created
- `stitch-server/crates/game_server/src/tables/account_profile.rs`
- `stitch-server/crates/game_server/src/tables/role_binding.rs`
- `stitch-server/crates/game_server/src/tables/live_ops.rs`
- `stitch-server/crates/game_server/src/tables/social.rs`
- `stitch-server/crates/game_server/src/tables/economy.rs`
- `stitch-server/crates/game_server/src/tables/world_state.rs`
- `stitch-server/crates/game_server/src/tables/player_progression.rs`
- `stitch-server/crates/game_server/src/tables/ops_moderation.rs`

### Modified
- `stitch-server/crates/game_server/src/tables/mod.rs`

## Verification
- `cargo check -p game_server` passed.
