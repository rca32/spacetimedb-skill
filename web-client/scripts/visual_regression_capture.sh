#!/usr/bin/env bash
set -euo pipefail

URL="${URL:-http://127.0.0.1:5173}"
OUT_DIR="${OUT_DIR:-/tmp/stitch-visual}"
TAG="${TAG:-baseline}"
SESSION="${SESSION:-visual-${TAG}-$(date +%s)}"
WARMUP_MS="${WARMUP_MS:-6000}"
MID_MOVE_MS="${MID_MOVE_MS:-1200}"
FAR_MOVE_MS="${FAR_MOVE_MS:-1800}"
DRY_RUN="${DRY_RUN:-0}"

usage() {
  cat <<USAGE
Visual regression capture (agent-browser)

Usage:
  $(basename "$0") [options]

Options:
  --url <url>            Target web-client URL (default: ${URL})
  --out-dir <path>       Output directory (default: ${OUT_DIR})
  --tag <name>           Capture tag/bucket (default: ${TAG})
  --session <name>       agent-browser session name (default: ${SESSION})
  --warmup-ms <ms>       Wait after network idle (default: ${WARMUP_MS})
  --mid-move-ms <ms>     KeyW hold for mid shot (default: ${MID_MOVE_MS})
  --far-move-ms <ms>     KeyW hold for far shot (default: ${FAR_MOVE_MS})
  --dry-run              Print commands only
  -h, --help             Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      URL="$2"; shift 2 ;;
    --out-dir)
      OUT_DIR="$2"; shift 2 ;;
    --tag)
      TAG="$2"; shift 2 ;;
    --session)
      SESSION="$2"; shift 2 ;;
    --warmup-ms)
      WARMUP_MS="$2"; shift 2 ;;
    --mid-move-ms)
      MID_MOVE_MS="$2"; shift 2 ;;
    --far-move-ms)
      FAR_MOVE_MS="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      usage
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2 ;;
  esac
done

run_cmd() {
  echo "+ $*"
  if [[ "$DRY_RUN" == "1" ]]; then
    return 0
  fi
  "$@"
}

capture_dir="${OUT_DIR%/}/${TAG}"
mkdir -p "$capture_dir"

cleanup() {
  if [[ "$DRY_RUN" != "1" ]]; then
    agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

move_forward() {
  local hold_ms="$1"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "+ agent-browser --session ${SESSION} eval --stdin  # move forward ${hold_ms}ms"
    return 0
  fi

  cat <<JS | agent-browser --session "$SESSION" eval --stdin >/dev/null
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
  await sleep(${hold_ms});
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }));
  return true;
})();
JS
}

near_png="${capture_dir}/${TAG}-near.png"
mid_png="${capture_dir}/${TAG}-mid.png"
far_png="${capture_dir}/${TAG}-far.png"

run_cmd agent-browser --session "$SESSION" open "$URL"
run_cmd agent-browser --session "$SESSION" wait --load networkidle
run_cmd agent-browser --session "$SESSION" wait "$WARMUP_MS"

run_cmd agent-browser --session "$SESSION" screenshot --full "$near_png"
move_forward "$MID_MOVE_MS"
run_cmd agent-browser --session "$SESSION" wait 800
run_cmd agent-browser --session "$SESSION" screenshot --full "$mid_png"
move_forward "$FAR_MOVE_MS"
run_cmd agent-browser --session "$SESSION" wait 800
run_cmd agent-browser --session "$SESSION" screenshot --full "$far_png"

if [[ "$DRY_RUN" != "1" ]]; then
  {
    echo "captured_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "url=${URL}"
    echo "session=${SESSION}"
    echo "tag=${TAG}"
    echo "warmup_ms=${WARMUP_MS}"
    echo "mid_move_ms=${MID_MOVE_MS}"
    echo "far_move_ms=${FAR_MOVE_MS}"
    sha256sum "$near_png" "$mid_png" "$far_png"
  } > "${capture_dir}/${TAG}.manifest"
fi

echo "[visual-capture] output: ${capture_dir}"
