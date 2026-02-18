#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-target}"
CDP_PORT="${2:-9223}"
HOST_IP="${3:-}"

if [[ -z "${HOST_IP}" ]]; then
  HOST_IP="$(ip route | awk '/default/ {print $3; exit}')"
fi

if [[ -z "${HOST_IP}" ]]; then
  echo "Unable to resolve Windows host IP from WSL default route."
  exit 1
fi

VERSION_JSON="$(curl -s --max-time 3 "http://${HOST_IP}:${CDP_PORT}/json/version" || true)"
if [[ -z "${VERSION_JSON}" ]]; then
  echo "CDP endpoint unreachable: http://${HOST_IP}:${CDP_PORT}/json/version"
  echo "Apply Admin portproxy rules and keep Windows browser running."
  exit 1
fi

WS_URL="$(printf "%s" "${VERSION_JSON}" | rg -o 'ws://[^"]+' | head -n1)"
if [[ -z "${WS_URL}" ]]; then
  echo "Failed to extract webSocketDebuggerUrl from CDP version payload."
  exit 1
fi

echo "Connecting agent-browser session '${SESSION_NAME}' to ${WS_URL}"
agent-browser --session "${SESSION_NAME}" connect "${WS_URL}"
echo "Connected."
