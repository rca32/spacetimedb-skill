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
```

## Auth / Session Bootstrap

```bash
spacetime call --server 127.0.0.1:3000 stitch-server account_bootstrap "player-one"
spacetime call --server 127.0.0.1:3000 stitch-server sign_in 1
spacetime call --server 127.0.0.1:3000 stitch-server sign_out
```

## Verify Seeded Data

```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) FROM item_def"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) FROM account"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) FROM player_state"
```

## Notes

- `import_csv_data` and `import_csv_by_type` are bootstrap reducers for the initial development phase.
- Full CSV pipeline and detailed data contracts will be implemented in follow-up work items.
- `session_state` is intentionally private; inspect via admin SQL tools only in controlled environments.
- If name lookup fails in your local CLI context, use the database identity shown by `spacetime publish`.
