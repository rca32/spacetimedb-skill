---
run: run-014
scope: single
created: 2026-02-08T13:26:00Z
items:
  - implement-moderation-audit-and-role-based-admin-controls
---

# Implementation Plan - run-014

## Work Item: implement-moderation-audit-and-role-based-admin-controls

### Design References
- `DESIGN/DETAIL/stitch-authentication-authorization.md`
- `DESIGN/17-security-privacy.md`
- `DESIGN/13-community-social.md`

### Implementation Checklist
- 운영 역할 검증 helper(`require_role`)와 역할 부여/해제 reducer 구현.
- 신고 접수/검토/조치 흐름 reducer 구현 (`report_queue`, `moderation_action`, `moderation_flag`, `ban_list`).
- 민감 운영 reducer에 감사 로그(`audit_log`) 기록 일원화.
- 운영 경로용 레이트리밋 helper(`rate_limit_bucket`) 추가 및 신고/조치 리듀서에 적용.

### Files to Create
- `stitch-server/crates/game_server/src/reducers/ops_moderation/mod.rs`
- `stitch-server/crates/game_server/src/reducers/ops_moderation/helpers.rs`
- `stitch-server/crates/game_server/src/reducers/ops_moderation/role_grant.rs`
- `stitch-server/crates/game_server/src/reducers/ops_moderation/role_revoke.rs`
- `stitch-server/crates/game_server/src/reducers/ops_moderation/report_submit.rs`
- `stitch-server/crates/game_server/src/reducers/ops_moderation/report_review.rs`
- `stitch-server/crates/game_server/src/reducers/ops_moderation/moderation_apply_action.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/reducers/mod.rs`

### Validation
- `cargo check -p game_server`
- `cargo test -p game_server ops_moderation -- --nocapture`
- `spacetime build` (in `stitch-server/crates/game_server`)
