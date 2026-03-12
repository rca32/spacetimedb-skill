#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MODULE_PATH="${SPACETIME_MODULE_PATH:-"${CLIENT_DIR}/../stitch-server/crates/game_server"}"
OUT_DIR="${CLIENT_DIR}/src/module_bindings"

mkdir -p "${OUT_DIR}"
rm -rf "${OUT_DIR:?}/"*

spacetime generate --lang typescript \
  --out-dir "${OUT_DIR}" \
  --module-path "${MODULE_PATH}"

# SpacetimeDB CLI 2.0.x emits index metadata without the accessor field
# required by the 2.0.x TypeScript SDK typings. Mirror the generated index
# name into accessor so generated bindings stay type-safe.
perl -0pi -e "s/\\{ name: '([^']+)', algorithm: '(btree|hash|direct)',/\\{ accessor: '\\1', name: '\\1', algorithm: '\\2',/g" \
  "${OUT_DIR}/index.ts"

# The generated client bindings currently emit `__schema({ ... })`, but the
# installed SDK runtime expects table handles to be passed as a list. Re-wrap
# the generated map into an object constant and spread its values into __schema
# so both runtime and typecheck stay aligned.
perl -0pi -e "s/const tablesSchema = __schema\\(\\{/const tableHandles = {/g" \
  "${OUT_DIR}/index.ts"
perl -0pi -e "s/\\n\\}\\);\\n\\n\\/\\*\\* The schema information for all reducers/\\n} as const;\\n\\nconst tablesSchema = __schema(Object.values(tableHandles) as unknown as Parameters<typeof __schema>\\[0\\]);\\n\\n\\/\\*\\* The schema information for all reducers/s" \
  "${OUT_DIR}/index.ts"
