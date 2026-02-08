---
run: run-016
scope: single
created: 2026-02-08T16:15:00Z
items:
  - establish-multi-identity-load-security-regression-suite
---

# Implementation Plan - run-016

## Work Item: establish-multi-identity-load-security-regression-suite

### Approach
- 기존 `scripts/cli_regression_suite.sh`의 단일 identity 회귀는 유지하고, 2+ identity를 전제로 한 확장 스크립트를 별도 추가한다.
- 보안 회귀(SEC-001~003)와 부하 점검 절차를 문서화하고, 실패 시 도메인별 진단 SQL/로그 체크리스트를 표준화한다.
- 자동 재실행 가능성을 위해 시나리오를 `--repeat`/prefix 기반 deterministic id로 구성한다.

### Implementation Checklist
- 다중 identity 시나리오 자동화 스크립트 추가(성공/실패 경로 포함).
- SEC-001(권한 상승), SEC-002(세션 하이재킹), SEC-003(private/RLS 노출 방지) 점검 명령 세트 고정.
- AOI/agent loop 중심의 부하 점검 절차(반복 호출 + 측정 SQL) 추가.
- 실패 triage용 SQL/로그 절차를 auth/combat/trade/social/moderation/economy 도메인별로 정리.

### Files to Create
- `stitch-server/scripts/cli_regression_multi_identity_security.sh`

### Files to Modify
- `stitch-server/docs/cli-regression-suite.md`
- `stitch-server/README.md`

### Validation
- `bash -n stitch-server/scripts/cli_regression_multi_identity_security.sh`
- `bash stitch-server/scripts/cli_regression_multi_identity_security.sh --help`
- `bash stitch-server/scripts/cli_regression_multi_identity_security.sh --dry-run --repeat 2`
