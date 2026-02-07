#!/usr/bin/env bash
set -euo pipefail

echo "Step 1: Static checks"
cargo fmt -- --check
cargo clippy -p game_server -- -D warnings

echo "Step 2: Unit tests"
cargo test -p game_server --test unit_auth --test unit_inventory --test unit_combat --test unit_quest

echo "Step 3: Integration tests"
cargo test -p game_server --test integration_trade_claim_npc

echo "Step 4: Regression snapshots"
echo "No snapshot runner configured"

echo "Step 5: Load tests (skipped)"
echo "Step 6: Security tests (skipped)"
