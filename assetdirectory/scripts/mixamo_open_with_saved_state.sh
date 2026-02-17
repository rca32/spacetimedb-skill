#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-mixamo}"
STATE_FILE="${2:-$HOME/.cache/agent-browser/mixamo-auth-state.json}"
TARGET_URL="${3:-https://www.mixamo.com/#/}"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "State file not found: $STATE_FILE"
  echo "Run this first:"
  echo "  assetdirectory/scripts/mixamo_human_login_and_save.sh \"$SESSION_NAME\" \"$STATE_FILE\""
  exit 1
fi

echo "Opening Mixamo with saved state..."
agent-browser --session "$SESSION_NAME" --state "$STATE_FILE" --headed open "$TARGET_URL"
agent-browser --session "$SESSION_NAME" wait 1500

CURRENT_URL="$(agent-browser --session "$SESSION_NAME" get url)"
echo "Current URL: $CURRENT_URL"
