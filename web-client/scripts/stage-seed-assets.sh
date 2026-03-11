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
  if [[ -d "${SOURCE_ROOT}/${pack}" ]]; then
    mkdir -p "${DEST_ROOT}/${pack}"
    mkdir -p "${PUBLIC_ROOT}/${pack}"
    rsync -a "${SOURCE_ROOT}/${pack}/" "${DEST_ROOT}/${pack}/"
    rsync -a "${SOURCE_ROOT}/${pack}/" "${PUBLIC_ROOT}/${pack}/"
  fi
done
