#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ASSET_MANIFEST="$REPO_ROOT/docs/manifests/bevy_asset_copy_manifest.csv"
CHAR_MANIFEST="$REPO_ROOT/docs/manifests/bevy_character_copy_manifest.csv"
AUDIO_MANIFEST="$REPO_ROOT/docs/manifests/bevy_audio_copy_manifest.csv"
LICENSE_MATRIX="$REPO_ROOT/docs/manifests/license_attribution_matrix.csv"

for path in "$ASSET_MANIFEST" "$CHAR_MANIFEST" "$AUDIO_MANIFEST" "$LICENSE_MATRIX"; do
  [[ -f "$path" ]] || { echo "missing manifest: $path" >&2; exit 1; }
done

declare -A TARGET_PATH_SEEN
declare -A ID_SEEN
ERROR_COUNT=0

verify_asset_rows() {
  while IFS=, read -r id _domain _bundle _source_pack source_path target_path _license _notes; do
    if [[ -n "${ID_SEEN[$id]:-}" ]]; then
      echo "duplicate id: $id" >&2
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    ID_SEEN["$id"]=1
    local src="$REPO_ROOT/$source_path"
    if [[ ! -f "$src" ]]; then
      echo "missing source: $src" >&2
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    if [[ -n "${TARGET_PATH_SEEN[$target_path]:-}" ]]; then
      echo "duplicate target path: $target_path" >&2
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    TARGET_PATH_SEEN["$target_path"]=1
  done < <(tail -n +2 "$ASSET_MANIFEST")
}

verify_generic_rows() {
  local manifest="$1"
  while IFS=, read -r id _bundle _source_pack source_path target_path _license _extra; do
    if [[ -n "${ID_SEEN[$id]:-}" ]]; then
      echo "duplicate id: $id" >&2
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    ID_SEEN["$id"]=1
    local src="$REPO_ROOT/$source_path"
    if [[ ! -f "$src" ]]; then
      echo "missing source: $src" >&2
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    if [[ -n "${TARGET_PATH_SEEN[$target_path]:-}" ]]; then
      echo "duplicate target path: $target_path" >&2
      ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    TARGET_PATH_SEEN["$target_path"]=1
  done < <(tail -n +2 "$manifest")
}

verify_asset_rows
verify_generic_rows "$CHAR_MANIFEST"
verify_generic_rows "$AUDIO_MANIFEST"

if [[ "$ERROR_COUNT" -gt 0 ]]; then
  echo "manifest verification failed with $ERROR_COUNT issue(s)" >&2
  exit 1
fi

echo "manifest verification passed"
