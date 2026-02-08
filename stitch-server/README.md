# stitch-server

Stitch MMO RPG SpacetimeDB server module.

## Quick Start

```bash
spacetime start
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish --server 127.0.0.1:3000 stitch-server
```

If an existing `stitch-server` database has an incompatible schema, publish either:

```bash
spacetime publish --server 127.0.0.1:3000 --delete-data stitch-server
# or use a fresh database name for bootstrap verification
spacetime publish --server 127.0.0.1:3000 stitch-server-bootstrap
```

## Seed / Import

```bash
spacetime call --server 127.0.0.1:3000 stitch-server seed_data
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_data
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_by_type "items"
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_by_type "buildings"
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_by_type "combat"
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_by_type "quests"
```

## Auth / Session Bootstrap

```bash
spacetime call --server 127.0.0.1:3000 stitch-server account_bootstrap "player-one"
spacetime call --server 127.0.0.1:3000 stitch-server sign_in 1
spacetime call --server 127.0.0.1:3000 stitch-server sign_out
```

## Authoritative Movement / Anti-Cheat

```bash
# 정상 이동
spacetime call --server 127.0.0.1:3000 stitch-server move_to "req-1" 1 1000 1.0 0.0 0.0

# 멱등 중복 요청 (same request_id): no-op 처리
spacetime call --server 127.0.0.1:3000 stitch-server move_to "req-1" 1 1000 1.0 0.0 0.0

# 위반 예시: 비정상 장거리 이동
spacetime call --server 127.0.0.1:3000 stitch-server move_to "req-2" 1 2000 100.0 0.0 0.0
```

위반 요청은 reducer 오류 대신 서버 no-op으로 처리되고 `movement_violation`/`movement_request_log`에 기록된다.

## Verify Seeded Data

```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM item_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM building_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM combat_action_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM quest_chain_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM account"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM player_state"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT entity_id, region_id, position FROM transform_state"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT identity, reason, attempted_position FROM movement_violation"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT identity, request_id, accepted FROM movement_request_log"
```

## Notes

- CSV files are loaded from `stitch-server/assets/static_data/{items,buildings,combat,quests}`.
- `import_csv_data` and `import_csv_by_type` run schema validation first and reject malformed rows.
- Full CSV pipeline and detailed data contracts will be implemented in follow-up work items.
- `session_state` is intentionally private; inspect via admin SQL tools only in controlled environments.
- If name lookup fails in your local CLI context, use the database identity shown by `spacetime publish`.

## Subscription Query Paths

`game_server::subscriptions` now provides separated query builders for AOI and domain streams:

- `position_stream_query` (`transform_state`, region scoped)
- `building_state_stream_query` / `claim_state_stream_query`
- `combat_state_stream_query` / `attack_outcome_stream_query`
- `inventory_container_stream_query` / `inventory_slot_stream_query` / `inventory_item_stream_query`

These are intended for selective client subscriptions instead of broad full-table subscriptions.

## CLI Regression Suite

Run the standardized end-to-end CLI regression flow:

```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server
bash scripts/cli_regression_suite.sh --db stitch-server --server 127.0.0.1:3000 --repeat 1
```

For repeatability checks:

```bash
REPEAT=3 bash scripts/cli_regression_suite.sh --db stitch-server --server 127.0.0.1:3000
```

Detailed scenario and failure diagnosis checklist:
- `stitch-server/docs/cli-regression-suite.md`

## Multi-Identity / Security / Load Regression

Run extended regression flow (SEC-001~003 + load probes):

```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server
bash scripts/cli_regression_multi_identity_security.sh --db stitch-server --server 127.0.0.1:3000 --repeat 1
```

Dry run:

```bash
bash scripts/cli_regression_multi_identity_security.sh --dry-run --repeat 2
```
