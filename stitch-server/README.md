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
# 정상 이동 intent
spacetime call --server 127.0.0.1:3000 stitch-server sync_client_frame 1 1 1 1000
spacetime call --server 127.0.0.1:3000 stitch-server submit_motion_intent "intent-1" 1 1 1 1.0 0.0 10.0 false

# correction 유발 예시: 존재하지 않는 dimension
spacetime call --server 127.0.0.1:3000 stitch-server sync_client_frame 2 1 999999 1016
spacetime call --server 127.0.0.1:3000 stitch-server submit_motion_intent "intent-2" 1 999999 2 1.0 0.0 10.0 false

# correction ack
spacetime call --server 127.0.0.1:3000 stitch-server ack_server_correction "intent-2:2:terrain_missing" 2
```

이상 이동은 reducer 오류 대신 `server_correction` / `ui_notification_event`로 되돌림과 ack 상태를 기록한다.

## Verify Seeded Data

```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM item_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM building_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM combat_action_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM quest_chain_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM account"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM player_state"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT entity_id, region_id, position FROM transform_state"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT frame_key, frame_no, client_time_ms FROM client_frame ORDER BY received_at DESC LIMIT 5"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT intent_id, frame_no, requested_speed FROM motion_intent ORDER BY submitted_at DESC LIMIT 5"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT entity_id, last_intent_id, last_frame_no FROM physics_state ORDER BY updated_at DESC LIMIT 5"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT correction_id, reason, acknowledged FROM server_correction ORDER BY created_at DESC LIMIT 5"
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

## Babylon / V2 Action Regression

Run the Babylon-facing server contract suite:

```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server
bash scripts/cli_regression_babylon_actions.sh --db stitch-server --server 127.0.0.1:3000 --repeat 1
```

Dry run:

```bash
bash scripts/cli_regression_babylon_actions.sh --dry-run --repeat 1
```

This suite verifies the Babylon client action contract around:

- `sync_client_frame`
- `submit_motion_intent`
- `ack_server_correction`
- `building_validate_preview`
- `submit_combat_intent`
- `npc_talk`

Key SQL/table assertions cover `motion_intent`, `physics_state`, `aoi_stream`, `server_correction`, `ui_notification_event`, `building_preview_feedback_view`, `combat_hit`, `combat_hit_event`, `fx_event`, `audio_event`, and `npc_interaction_log`.

If `bash` cannot find the CLI on Windows, set `SPACETIME_BIN` to your `spacetime.exe` path before running the script.

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
