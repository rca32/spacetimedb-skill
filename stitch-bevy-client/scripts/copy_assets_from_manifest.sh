#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

INCLUDE_OPTIONAL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --include-optional)
      INCLUDE_OPTIONAL=1
      shift
      ;;
    *)
      echo "unknown option: $1" >&2
      exit 1
      ;;
  esac
done

copy_from_manifest_asset() {
  local manifest="$1"
  tail -n +2 "$manifest" | while IFS=, read -r _id _domain bundle _source_pack source_path target_path _license _notes; do
    [[ -n "${source_path:-}" ]] || continue
    if [[ "$bundle" == "optional" && "$INCLUDE_OPTIONAL" -eq 0 ]]; then
      continue
    fi
    local src="$REPO_ROOT/$source_path"
    local dst
    if [[ "$target_path" == bevy-client/assets/* ]]; then
      dst="$REPO_ROOT/stitch-bevy-client/assets/${target_path#bevy-client/assets/}"
    else
      dst="$REPO_ROOT/$target_path"
    fi
    mkdir -p "$(dirname "$dst")"
    cp -f "$src" "$dst"
  done
}

copy_from_manifest_generic() {
  local manifest="$1"
  tail -n +2 "$manifest" | while IFS=, read -r _id bundle _source_pack source_path target_path _license _usage; do
    [[ -n "${source_path:-}" ]] || continue
    if [[ "$bundle" == "optional" && "$INCLUDE_OPTIONAL" -eq 0 ]]; then
      continue
    fi
    local src="$REPO_ROOT/$source_path"
    local dst
    if [[ "$target_path" == bevy-client/assets/* ]]; then
      dst="$REPO_ROOT/stitch-bevy-client/assets/${target_path#bevy-client/assets/}"
    else
      dst="$REPO_ROOT/$target_path"
    fi
    mkdir -p "$(dirname "$dst")"
    cp -f "$src" "$dst"
  done
}

ASSET_MANIFEST="$REPO_ROOT/docs/manifests/bevy_asset_copy_manifest.csv"
CHAR_MANIFEST="$REPO_ROOT/docs/manifests/bevy_character_copy_manifest.csv"
AUDIO_MANIFEST="$REPO_ROOT/docs/manifests/bevy_audio_copy_manifest.csv"

[[ -f "$ASSET_MANIFEST" ]] || { echo "missing: $ASSET_MANIFEST" >&2; exit 1; }
[[ -f "$CHAR_MANIFEST" ]] || { echo "missing: $CHAR_MANIFEST" >&2; exit 1; }
[[ -f "$AUDIO_MANIFEST" ]] || { echo "missing: $AUDIO_MANIFEST" >&2; exit 1; }

copy_from_manifest_asset "$ASSET_MANIFEST"
copy_from_manifest_generic "$CHAR_MANIFEST"
copy_from_manifest_generic "$AUDIO_MANIFEST"

echo "asset copy complete (include_optional=$INCLUDE_OPTIONAL)"
