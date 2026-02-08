---
run: run-014
generated: 2026-02-08T13:39:00Z
status: passed
---

# Test Report - run-014

## Environment
- Module: `stitch-server/crates/game_server`
- Commands:
  - `cargo check -p game_server`
  - `cargo test -p game_server ops_moderation -- --nocapture`
  - `spacetime build`

## Work Item: implement-moderation-audit-and-role-based-admin-controls

### Test Results
- Passed: yes
- Failed: 0
- Skipped: 0

### Acceptance Criteria Validation
- 역할 기반 운영 리듀서 접근 제어: `require_admin`, `require_ops_role`로 적용.
- 신고→검토→조치 흐름 추적: `report_submit`, `report_review`, `moderation_apply_action`에서 `report_queue`/`moderation_action`/`moderation_flag`/`ban_list` 연동.
- 민감 리듀서 감사 로그와 레이트리밋: `append_audit_log`, `ensure_ops_rate_limit` 공통 적용.

## Notes
- `wasm-opt` 미설치 경고가 있으나 모듈 빌드는 정상 완료.
