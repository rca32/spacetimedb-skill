#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOURCE_ROOT="${CLIENT_DIR}/../assetdirectory/pack/kenney"
DEST_ROOT="${CLIENT_DIR}/assets-src/seed/kenney"
PUBLIC_ROOT="${CLIENT_DIR}/public/assets/seed/kenney"

PACKS=(
  "ui-pack"
  "ui-pack-rpg-expansion"
  "input-prompts"
  "tiny-town"
  "top-down-shooter"
  "impact-sounds"
)

mkdir -p "${DEST_ROOT}"
mkdir -p "${PUBLIC_ROOT}"

for pack in "${PACKS[@]}"; do
  SOURCE_PACK="${SOURCE_ROOT}/${pack}"
  DEST_PACK="${DEST_ROOT}/${pack}"
  PUBLIC_PACK="${PUBLIC_ROOT}/${pack}"

  mkdir -p "${DEST_PACK}"
  mkdir -p "${PUBLIC_PACK}"

  if [[ -d "${SOURCE_PACK}" ]]; then
    rsync -a "${SOURCE_PACK}/" "${DEST_PACK}/"
  fi

  if [[ -d "${DEST_PACK}" ]]; then
    rsync -a "${DEST_PACK}/" "${PUBLIC_PACK}/"
  fi
done
