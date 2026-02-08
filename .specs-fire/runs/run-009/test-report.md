---
run: run-009
generated: 2026-02-08T10:05:00Z
status: passed
---

# Test Report - run-009

## Environment
- Module: `stitch-server`
- Command:
  - `cargo check -p game_server`

## Work Item: establish-extended-schema-for-liveops-social-security-domains

### Test Results
- Passed: yes
- Failed: 0
- Skipped: 0

### Acceptance Criteria Validation
- 누락 핵심 테이블군(account_profile/role_binding/resource_state/status_effect/chat/guild/party/wallet/audit/rate_limit/feature_flags 등) 추가 완료.
- 신규 테이블은 설계 의도에 맞춰 public/private 경계로 정의됨.
- `cargo check -p game_server` 통과로 빌드/매크로 정합성 확인.

## Coverage
- Unit tests added: 0
- Coverage metric: not available
