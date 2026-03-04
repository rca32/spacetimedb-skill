# clientv2 Cutover Checklist

1. `bun run release:check` passes with zero assertion failures.
2. `artifacts/gate0/<run_id>/visual-proof-index.json` exists and lists scenario frames.
3. `artifacts/perf/<run_id>/perf_budget.json` exists with `"pass": true`.
4. `artifacts/release/<run_id>/risk_snapshot.json` exists with `"pass": true`.
5. rollback package (`dist/` + previous stable config) is available before deploy.
6. post-cutover smoke run validates `S01~S05` with same runbook.
