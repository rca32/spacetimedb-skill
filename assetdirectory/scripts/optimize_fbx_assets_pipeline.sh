#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="${1:-web-client/public/assets/animations/mixamo}"
OUTPUT_DIR="${2:-$INPUT_DIR}"
MANIFEST_PATH="${3:-web-client/public/assets/manifest.json}"
ASSET_ROOT="${4:-web-client/public}"

"$(dirname "$0")/convert_fbx_to_glb_gltfpack.sh" "$INPUT_DIR" "$OUTPUT_DIR"
"$(dirname "$0")/patch_manifest_use_optimized_glb.sh" "$MANIFEST_PATH" "$ASSET_ROOT"

echo "pipeline done"
