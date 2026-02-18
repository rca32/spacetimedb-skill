#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="${BASE_DIR:-}"
CANDIDATE_DIR="${CANDIDATE_DIR:-}"
THRESHOLD_RATIO="${THRESHOLD_RATIO:-0}"
REPORT_PATH="${REPORT_PATH:-/tmp/stitch-visual-compare-$(date +%Y%m%d-%H%M%S).txt}"

usage() {
  cat <<USAGE
Visual regression comparator

Usage:
  $(basename "$0") --base <dir> --candidate <dir> [--threshold <ratio>] [--report <path>]

Options:
  --base <dir>         Baseline image directory
  --candidate <dir>    Candidate image directory
  --threshold <ratio>  Allowed pixel-diff ratio [0..1] when ImageMagick compare is available
                        default: ${THRESHOLD_RATIO}
  --report <path>      Report output path (default: ${REPORT_PATH})
  -h, --help           Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_DIR="$2"; shift 2 ;;
    --candidate)
      CANDIDATE_DIR="$2"; shift 2 ;;
    --threshold)
      THRESHOLD_RATIO="$2"; shift 2 ;;
    --report)
      REPORT_PATH="$2"; shift 2 ;;
    -h|--help)
      usage
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2 ;;
  esac
done

if [[ -z "$BASE_DIR" || -z "$CANDIDATE_DIR" ]]; then
  usage
  exit 2
fi
if [[ ! -d "$BASE_DIR" ]]; then
  echo "baseline directory missing: $BASE_DIR" >&2
  exit 2
fi
if [[ ! -d "$CANDIDATE_DIR" ]]; then
  echo "candidate directory missing: $CANDIDATE_DIR" >&2
  exit 2
fi

mkdir -p "$(dirname "$REPORT_PATH")"

has_imagemagick=0
if command -v compare >/dev/null 2>&1 && command -v identify >/dev/null 2>&1; then
  has_imagemagick=1
fi

mapfile -t base_files < <(find "$BASE_DIR" -maxdepth 1 -type f -name '*.png' -printf '%f\n' | LC_ALL=C sort)
if [[ "${#base_files[@]}" -eq 0 ]]; then
  echo "no baseline png files found in $BASE_DIR" >&2
  exit 2
fi

failed=0
{
  echo "[visual-compare] base=${BASE_DIR}"
  echo "[visual-compare] candidate=${CANDIDATE_DIR}"
  echo "[visual-compare] threshold_ratio=${THRESHOLD_RATIO}"
  echo "[visual-compare] mode=$([[ "$has_imagemagick" == "1" ]] && echo imagemagick || echo sha256)"

  for filename in "${base_files[@]}"; do
    base_file="${BASE_DIR%/}/${filename}"
    candidate_file="${CANDIDATE_DIR%/}/${filename}"

    if [[ ! -f "$candidate_file" ]]; then
      echo "FAIL ${filename}: missing in candidate"
      failed=1
      continue
    fi

    if [[ "$has_imagemagick" == "1" ]]; then
      diff_px_raw="$(compare -metric AE "$base_file" "$candidate_file" null: 2>&1 || true)"
      diff_px="$(echo "$diff_px_raw" | tr -cd '0-9')"
      if [[ -z "$diff_px" ]]; then
        diff_px=0
      fi
      total_px="$(identify -format '%[fx:w*h]' "$base_file" | tr -d ' ')"
      ratio="$(awk -v d="$diff_px" -v t="$total_px" 'BEGIN { if (t <= 0) { print "1"; exit } printf "%.8f", d / t }')"
      over="$(awk -v r="$ratio" -v th="$THRESHOLD_RATIO" 'BEGIN { print (r > th) ? 1 : 0 }')"
      if [[ "$over" == "1" ]]; then
        echo "FAIL ${filename}: ratio=${ratio} diff_px=${diff_px} total_px=${total_px}"
        failed=1
      else
        echo "PASS ${filename}: ratio=${ratio} diff_px=${diff_px} total_px=${total_px}"
      fi
    else
      base_hash="$(sha256sum "$base_file" | awk '{print $1}')"
      candidate_hash="$(sha256sum "$candidate_file" | awk '{print $1}')"
      if [[ "$base_hash" != "$candidate_hash" ]]; then
        echo "FAIL ${filename}: sha256 mismatch"
        failed=1
      else
        echo "PASS ${filename}: sha256 match"
      fi
    fi
  done
} | tee "$REPORT_PATH"

if [[ "$failed" == "1" ]]; then
  echo "[visual-compare] mismatch detected. report=${REPORT_PATH}" >&2
  exit 1
fi

echo "[visual-compare] all files matched. report=${REPORT_PATH}"
