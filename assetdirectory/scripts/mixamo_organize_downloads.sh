#!/usr/bin/env bash
set -euo pipefail

CHAR_NAME="player"
SOURCE_DIR="${HOME}/Downloads"
TARGET_ROOT="assetdirectory/mixamo"
ACTION="move"
EXTRACT_ZIPS=0
DRY_RUN=0
RENAME_ANIMS=1
MODEL_BASE_NAME=""

target_animation_dir=""

usage() {
  cat <<'USAGE'
Usage: mixamo_organize_downloads.sh [options]

Options:
  -c, --character NAME      Character slug (default: player)
  -s, --source DIR          Download source directory (default: ~/Downloads)
  -t, --target DIR          Target root directory (default: assetdirectory/mixamo)
  -a, --action ACTION       move | copy (default: move)
      --extract-zips        Extract ZIP files into staging before organizing
  -m, --model-name NAME     Optional model base name (e.g. player_loco_character)
      --no-rename-anims     Keep original animation filenames
      --dry-run             Print planned moves only
  -h, --help                Show help

Examples:
  assetdirectory/scripts/mixamo_organize_downloads.sh
  assetdirectory/scripts/mixamo_organize_downloads.sh -c hero -s ~/Downloads/mixamo
  assetdirectory/scripts/mixamo_organize_downloads.sh --model-name player_loco_character
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--character)
      CHAR_NAME="$2"; shift 2 ;;
    -s|--source)
      SOURCE_DIR="$2"; shift 2 ;;
    -t|--target)
      TARGET_ROOT="$2"; shift 2 ;;
    -a|--action)
      ACTION="$2"; shift 2 ;;
    --extract-zips)
      EXTRACT_ZIPS=1; shift ;;
    -m|--model-name)
      MODEL_BASE_NAME="$2"; shift 2 ;;
    --no-rename-anims)
      RENAME_ANIMS=0; shift ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      usage
      exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$ACTION" != "move" && "$ACTION" != "copy" ]]; then
  echo "Invalid action: $ACTION (use move or copy)" >&2
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

RAW_MODEL_DIR="$TARGET_ROOT/raw/models/$CHAR_NAME"
RAW_ANIM_DIR="$TARGET_ROOT/raw/animations/$CHAR_NAME"
RAW_STAGING="$TARGET_ROOT/raw/character_staging/$CHAR_NAME"
PROCESSED_GLB_CHAR="$TARGET_ROOT/processed/glb/characters"
PROCESSED_GLB_ANIM="$TARGET_ROOT/processed/glb/animations"
MANIFEST="$TARGET_ROOT/meta/mixamo_manifest.csv"

mkdir -p \
  "$RAW_MODEL_DIR" "$RAW_ANIM_DIR" "$RAW_STAGING" \
  "$PROCESSED_GLB_CHAR" "$PROCESSED_GLB_ANIM" \
  "$(dirname "$MANIFEST")"

if [[ ! -f "$MANIFEST" ]]; then
  echo "kind,source_file,target_path,size_bytes,sha256" > "$MANIFEST"
fi

shopt -s nullglob

declare -a SOURCES=(
  "$SOURCE_DIR"/*.{fbx,glb,gltf,zip,glTF,GLTF,FBX,GLB}
)

declare -a LOCO_ANIMATION_KEYS=(
  walk walk_forward walk_backward walk_left walk_right
  walk_for walk_back walk_strafe_left walk_strafe_right
  walking walking_forward walking_backward walking_left walking_right
  run run_forward run_backward run_left run_right
  running running_forward running_backward running_left running_right
  sprint sprint_forward sprint_backward sprint_left sprint_right
  strafe strafe_left strafe_right
  idle
)

declare -a SKIP_PATTERNS=(
  "*_sample*" "*sample*" "*meta*" "*manifest*"
)

match_pattern() {
  local pattern="$1"
  local value="$2"
  case "$value" in
    $pattern) return 0 ;;
    *) return 1 ;;
  esac
}

looks_like_animation() {
  local name="${1,,}"
  for k in "${SKIP_PATTERNS[@]}"; do
    if match_pattern "$k" "$name"; then
      return 1
    fi
  done

  for k in "${LOCO_ANIMATION_KEYS[@]}"; do
    if match_pattern "*${k}*" "$name"; then
      return 0
    fi
  done

  return 1
}

alias_for_animation() {
  local name="${1,,}"

  # Idle
  if match_pattern "*idle*" "$name"; then
    echo "player_loco_idle"
    return
  fi

  # Run (directional)
  if match_pattern "*run*" "$name"; then
    if match_pattern "*run*back*" "$name" || match_pattern "*run*backward*" "$name" || match_pattern "*running*back*" "$name"; then
      echo "player_loco_run_backward"; return
    fi
    if match_pattern "*run*left*" "$name" || match_pattern "*running*left*" "$name" || match_pattern "*run*strafe*left*" "$name"; then
      echo "player_loco_run_left"; return
    fi
    if match_pattern "*run*right*" "$name" || match_pattern "*running*right*" "$name" || match_pattern "*run*strafe*right*" "$name"; then
      echo "player_loco_run_right"; return
    fi
    echo "player_loco_run_forward"; return
  fi

  # Walk/Sprint (directional)
  if match_pattern "*walk*" "$name" || match_pattern "*walking*" "$name"; then
    if match_pattern "*walk*back*" "$name" || match_pattern "*walk*backward*" "$name" || match_pattern "*walking*back*" "$name" || match_pattern "*walking*backward*" "$name"; then
      echo "player_loco_walk_backward"; return
    fi
    if match_pattern "*walk*left*" "$name" || match_pattern "*walking*left*" "$name" || match_pattern "*walk*strafe*left*" "$name" || match_pattern "*walking*left*" "$name"; then
      echo "player_loco_walk_left"; return
    fi
    if match_pattern "*walk*right*" "$name" || match_pattern "*walking*right*" "$name" || match_pattern "*walk*strafe*right*" "$name" || match_pattern "*walking*right*" "$name"; then
      echo "player_loco_walk_right"; return
    fi
    echo "player_loco_walk_forward"; return
  fi

  if match_pattern "*strafe*left*" "$name" || match_pattern "*strafe*left*" "$name"; then
    echo "player_loco_walk_left"; return
  fi

  if match_pattern "*strafe*right*" "$name"; then
    echo "player_loco_walk_right"; return
  fi

  echo "player_animation"
}

looks_like_model() {
  local name="${1,,}"
  for k in "*player*" "*character*" "*t-pose*" "*tpose*" "*base*"; do
    match_pattern "$k" "$name" && return 0
  done
  return 1
}

sanitize_name() {
  local input="$1"
  echo "${input//[^A-Za-z0-9._-]/_}"
}

copy_or_move() {
  local src="$1" dst="$2"
  if [[ "$ACTION" == "move" ]]; then
    mv "$src" "$dst"
  else
    cp -v "$src" "$dst"
  fi
}

process_file() {
  local src="$1"
  local ext="${src##*.}"
  local base
  base="$(basename "$src")"
  local lower="${base,,}"
  local target_dir
  local filename

  if [[ "$ext" == "zip" || "$ext" == "ZIP" ]]; then
    if [[ "$EXTRACT_ZIPS" -eq 1 ]]; then
      if command -v unzip >/dev/null 2>&1; then
        if [[ "$DRY_RUN" == 1 ]]; then
          echo "[dry-run] unzip -q -o $src -d $RAW_STAGING"
        else
          unzip -q -o "$src" -d "$RAW_STAGING"
          echo "[zip] unpacked: $src -> $RAW_STAGING"
        fi
      else
        echo "unzip command not available; skipping zip file: $src" >&2
      fi
    else
      echo "[skip] zip file (use --extract-zips): $src"
    fi
    return
  fi

  if looks_like_animation "$lower"; then
    target_dir="$RAW_ANIM_DIR"
    if [[ "$RENAME_ANIMS" -eq 1 ]]; then
      filename="$(alias_for_animation "$lower").${ext}"
    else
      filename="$(sanitize_name "$base")"
    fi
  else
    target_dir="$RAW_MODEL_DIR"
    if [[ -n "$MODEL_BASE_NAME" ]] && looks_like_model "$lower"; then
      filename="${MODEL_BASE_NAME}.${ext}"
    else
      filename="$(sanitize_name "$base")"
    fi
  fi

  local dst="$target_dir/$filename"

  if [[ "$DRY_RUN" == 1 ]]; then
    echo "[dry-run] $src -> $dst"
    return
  fi

  if [[ -f "$dst" ]]; then
    local ts
    ts="$(date +%Y%m%d_%H%M%S)"
    dst="$target_dir/${filename%.*}_$ts.${ext}"
  fi

  copy_or_move "$src" "$dst"

  local hash
  hash="$(sha256sum "$dst" | awk '{print $1}')"
  local size
  size="$(stat -c %s "$dst")"
  local kind="model"
  if [[ "$target_dir" == "$RAW_ANIM_DIR" ]]; then
    kind="animation"
  fi
  echo "$kind,$base,$dst,$size,$hash" >> "$MANIFEST"

  echo "[${ACTION}] $src -> $dst"
}

if [[ ${#SOURCES[@]} -eq 0 ]]; then
  echo "No candidate files in source dir: $SOURCE_DIR"
  exit 0
fi

for src in "${SOURCES[@]}"; do
  [[ -f "$src" ]] || continue
  process_file "$src"
done

if [[ "$DRY_RUN" == 1 ]]; then
  echo "Dry run completed. Use without --dry-run to apply."
else
  echo "Manifest updated: $MANIFEST"
  echo "Processed animations directory: $RAW_ANIM_DIR"
  echo "Processed models directory: $RAW_MODEL_DIR"
fi
