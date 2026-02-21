#!/usr/bin/env bash
set -euo pipefail

BINDINGS_INDEX="src/module_bindings/index.ts"

if [[ ! -f "$BINDINGS_INDEX" ]]; then
  echo "bindings index not found: $BINDINGS_INDEX" >&2
  exit 1
fi

# SpacetimeDB 1.11.3 TS runtime does not export Uuid; generated import breaks typecheck.
sed -i '/Uuid as __Uuid,/d' "$BINDINGS_INDEX"
