#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-target}"
OUT_FILE="${2:-$HOME/.cache/agent-browser/${SESSION_NAME}-state.json}"

mkdir -p "$(dirname "$OUT_FILE")"

echo "Saving state from session '${SESSION_NAME}' to '${OUT_FILE}'"
agent-browser --session "${SESSION_NAME}" state save "${OUT_FILE}"
echo "Saved."
