---
run: run-016
generated: 2026-02-08T16:19:00Z
status: passed
---

# Test Report - run-016

## Environment
- Module: `stitch-server`
- Commands:
  - `bash -n scripts/cli_regression_multi_identity_security.sh`
  - `bash scripts/cli_regression_multi_identity_security.sh --help`
  - `bash scripts/cli_regression_multi_identity_security.sh --dry-run --repeat 2 --db stitch-server --server 127.0.0.1:3000`

## Work Item: establish-multi-identity-load-security-regression-suite

### Test Results
- Passed: yes
- Failed: 0
- Skipped: 0

### Acceptance Criteria Validation
- 2개 이상 identity 기반 성공/실패 시나리오 자동 재실행: multi-identity 스크립트가 `--repeat` 기반으로 expected-fail/성공 흐름 반복 수행.
- 보안 회귀(SEC-001~003) 및 부하 점검 절차 고정: 스크립트/문서에 고정 절차 추가.
- 실패 진단 SQL/로그 절차 업데이트: `docs/cli-regression-suite.md`에 도메인별 triage 순서/진단 SQL 확장.

## Notes
- 본 검증은 dry-run 기반 명령 경로 검증이며, 실서버 실행은 문서 절차(SpacetimeDB start/publish) 이후 수행 필요.
