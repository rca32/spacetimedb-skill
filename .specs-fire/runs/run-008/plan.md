---
run: run-008
scope: single
created: 2026-02-08T00:24:10Z
items:
  - establish-full-cli-integration-regression-suite
---

# Implementation Plan - run-008

## Work Item: establish-full-cli-integration-regression-suite

### Approach
- Add an executable CLI regression runner script under `stitch-server/scripts/` that standardizes the end-to-end flow:
  - connect/auth → movement → inventory bootstrap → building/claim → combat guardrail check → NPC/quest → market order flow.
- Support repeat execution with stable pass criteria using looped runs and deterministic IDs.
- Add a dedicated regression guide under `stitch-server/docs/` with:
  - single scenario and split scenario (manual two-party extensions)
  - failure diagnosis SQL checklist and investigation order
  - alignment notes for `stitch-server-ai-tester` usage.
- Link the regression suite entrypoint from `stitch-server/README.md`.

### Files to Create
- `stitch-server/scripts/cli_regression_suite.sh`
- `stitch-server/docs/cli-regression-suite.md`

### Files to Modify
- `stitch-server/README.md`

### Validation
- `bash -n stitch-server/scripts/cli_regression_suite.sh`
- `cargo check -p game_server`
- (environment-dependent) dry-run usage check of script help output
