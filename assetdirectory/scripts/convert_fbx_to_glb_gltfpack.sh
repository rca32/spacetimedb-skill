#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="${1:-web-client/public/assets/animations/mixamo}"
OUTPUT_DIR="${2:-$INPUT_DIR}"
WORK_DIR="${3:-assetdirectory/.tmp/fbx2glb}"

if [[ ! -d "$INPUT_DIR" ]]; then
  echo "input directory not found: $INPUT_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR" "$WORK_DIR"

CONVERTER_CMD=()
CONVERTER_MODE=""
if command -v FBX2glTF >/dev/null 2>&1; then
  CONVERTER_CMD=(FBX2glTF)
  CONVERTER_MODE="fbx2gltf"
elif command -v fbx2gltf >/dev/null 2>&1; then
  CONVERTER_CMD=(fbx2gltf)
  CONVERTER_MODE="fbx2gltf"
elif command -v npx >/dev/null 2>&1; then
  CONVERTER_CMD=(npx --yes 3d-convert fbx2glb)
  CONVERTER_MODE="3d-convert"
fi

GLTFPACK_CMD=()
if command -v gltfpack >/dev/null 2>&1; then
  GLTFPACK_CMD=(gltfpack)
elif command -v npx >/dev/null 2>&1; then
  GLTFPACK_CMD=(npx --yes gltfpack)
fi

if [[ ${#CONVERTER_CMD[@]} -eq 0 ]]; then
  echo "missing converter: install FBX2glTF/fbx2gltf or enable npx 3d-convert" >&2
  exit 2
fi

if [[ ${#GLTFPACK_CMD[@]} -eq 0 ]]; then
  echo "missing gltfpack: install gltfpack or enable npx" >&2
  exit 3
fi

converted=0
failed=0

while IFS= read -r -d '' src; do
  base="$(basename "$src" .fbx)"
  tmp="$WORK_DIR/${base}.raw.glb"
  dst="$OUTPUT_DIR/${base}.glb"

  echo "[convert] $src -> $dst"
  if [[ "$CONVERTER_MODE" == "fbx2gltf" ]]; then
    if ! "${CONVERTER_CMD[@]}" --binary --input "$src" --output "$tmp"; then
      echo "  failed: fbx->glb conversion ($src)" >&2
      failed=$((failed + 1))
      continue
    fi
  else
    if ! "${CONVERTER_CMD[@]}" -i "$src" -o "$tmp"; then
      echo "  failed: fbx->glb conversion ($src)" >&2
      failed=$((failed + 1))
      continue
    fi
  fi
  if [[ ! -f "$tmp" ]]; then
    echo "  failed: fbx->glb conversion ($src)" >&2
    failed=$((failed + 1))
    continue
  fi

  if ! "${GLTFPACK_CMD[@]}" -i "$tmp" -o "$dst" -cc -tc -si 1 -vp 14 -vt 14 -vn 10 -km -kn; then
    echo "  warn: gltfpack -tc failed, retry without texture compression ($src)" >&2
    if ! "${GLTFPACK_CMD[@]}" -i "$tmp" -o "$dst" -cc -si 1 -vp 14 -vt 14 -vn 10 -km -kn; then
      echo "  failed: gltfpack optimize ($src)" >&2
      failed=$((failed + 1))
      rm -f "$tmp"
      continue
    fi
  fi

  rm -f "$tmp"
  converted=$((converted + 1))
done < <(find "$INPUT_DIR" -maxdepth 1 -type f -name '*.fbx' -print0)

echo "done: converted=$converted failed=$failed output_dir=$OUTPUT_DIR"
