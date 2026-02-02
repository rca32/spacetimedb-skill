# Stitch Server

Rust workspace for the Stitch game server.

## Structure

- `crates/game_server`: SpacetimeDB module code (tables, reducers, agents, services)
- `crates/shared_types`: Shared types for the server ecosystem
- `crates/data_loader`: Static data loading helpers
- `assets/`: Static data inputs (CSV/PNG placeholders)
- `scripts/`: Dev/test helper scripts
- `tests/`: Fixtures and test scaffolding

## Common Commands

```bash
# Build checks
cargo check

# Run game_server tests
cargo test -p game_server --tests

# Run the test pipeline script
./scripts/run_test_pipeline.sh
```

cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish stitch-server
