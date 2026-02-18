#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-target}"
KEY="${2:-}"

if [[ -z "${KEY}" ]]; then
  echo "Usage: $0 <session-name> <localStorage-key>" >&2
  exit 1
fi

agent-browser --session "${SESSION_NAME}" eval "(() => localStorage.getItem(${KEY@Q}) ?? '')()"
