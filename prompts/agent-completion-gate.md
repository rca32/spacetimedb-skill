# Agent Completion Gate Template

완료 선언은 아래 3개 근거가 모두 있을 때만 허용한다.

1. `bun run typecheck` 결과
2. `bun run test:lane-a` 결과
3. 아티팩트 경로
   - `artifacts/gate0/<run_id>/report.json`
   - `artifacts/gate0/<run_id>/scenario_coverage.json`
   - `artifacts/gate0/<run_id>/visual-proof-index.json`
   - `artifacts/perf/<run_id>/perf_budget.json`

미충족 시 상태 문구는 `진행중`으로 고정한다.
