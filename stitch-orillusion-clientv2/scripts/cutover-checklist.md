# clientv2 Cutover Checklist

1. `bun run release:check` passes with zero assertion failures.
2. `artifacts/gate0/<run_id>/visual-proof-index.json` exists and lists scenario frames.
3. `artifacts/perf/<run_id>/perf_budget.json` exists with `"pass": true`.
4. `artifacts/release/<run_id>/risk_snapshot.json` exists with `"pass": true`.
5. rollback package (`dist/` + previous stable config) is available before deploy.
6. post-cutover smoke run validates `S01~S07` with same runbook.
7. visual gate confirms no blank frame and no `frame_capture_missing_canvas` event.
