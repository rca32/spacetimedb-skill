---
run: run-011
generated: 2026-02-08T10:54:00Z
status: passed
---

# Test Report - run-011

## Environment
- Module: `stitch-server/crates/game_server`
- Commands:
  - `cargo check -p game_server`
  - `spacetime build`

## Work Item: implement-environment-debuff-and-status-effect-pipeline

### Test Results
- Passed: yes
- Failed: 0
- Skipped: 0

### Acceptance Criteria Validation
- 온라인 세션 기반 환경 효과 평가 루프 추가(`environment_effect_agent_loop`).
- `status_effect` upsert 및 만료 정리 경로를 루프 내부에 연결.
- 피해 최소 간격/노출 게이트/노출 감쇠 배율을 `balance_params` 키로 읽도록 구현.

## Notes
- `wasm-opt` 미설치로 최적화는 생략되었지만 모듈 빌드는 성공.
