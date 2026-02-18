#!/usr/bin/env bash
set -euo pipefail

LEFT="${1:-}"
RIGHT="${2:-}"

usage() {
  cat <<USAGE
Worldgen deterministic snapshot comparator

Usage:
  $(basename "$0") <snapshot-a> <snapshot-b>

Compares key=value snapshot files emitted by worldgen_determinism_snapshot.sh.
`captured_at`, `path_probe_fingerprint`, `path_probe_explored_nodes` are ignored by default.
Returns non-zero when significant fields differ.
USAGE
}

if [[ -z "$LEFT" || -z "$RIGHT" ]]; then
  usage
  exit 2
fi

if [[ ! -f "$LEFT" ]]; then
  echo "missing file: $LEFT" >&2
  exit 2
fi
if [[ ! -f "$RIGHT" ]]; then
  echo "missing file: $RIGHT" >&2
  exit 2
fi

normalize() {
  local path="$1"
  awk -F= '
    /^[a-z0-9_]+=.*/ {
      key = $1
      if (key == "captured_at" || key == "path_probe_fingerprint" || key == "path_probe_explored_nodes") {
        next
      }
      print
    }
  ' "$path" | LC_ALL=C sort
}

echo "[compare] left:  ${LEFT}"
echo "[compare] right: ${RIGHT}"

if diff -u <(normalize "$LEFT") <(normalize "$RIGHT"); then
  echo "[compare] deterministic snapshot match"
  exit 0
fi

echo "[compare] mismatch detected" >&2
exit 1
