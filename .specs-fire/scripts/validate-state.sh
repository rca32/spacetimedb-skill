#!/usr/bin/env bash
set -euo pipefail

state_file=".specs-fire/state.yaml"

if [[ ! -f "$state_file" ]]; then
  echo "ERROR: $state_file not found"
  exit 1
fi

errors=0

# 1) Intent status cascade validation.
while IFS='|' read -r intent state expected totals; do
  if [[ "$state" != "$expected" ]]; then
    echo "ERROR: intent '$intent' status mismatch (state=$state expected=$expected) [$totals]"
    errors=$((errors + 1))
  fi
done < <(
  awk '
  /^intents:/ {in_intents=1; next}
  /^runs:/ {in_intents=0}
  !in_intents {next}
  /^  - id:/ {intent=$3}
  /^    status:/ {intent_status[intent]=$2; intents[intent]=1}
  /^      - id:/ {wi=$3}
  /^        status:/ {
    st=$2
    total[intent]++
    if (st=="completed") c[intent]++
    else if (st=="in_progress") p[intent]++
    else if (st=="pending") n[intent]++
  }
  END {
    for (i in intents) {
      expected="pending"
      if (p[i] > 0) expected="in_progress"
      else if (total[i] > 0 && c[i] == total[i]) expected="completed"
      else if (c[i] > 0 && n[i] > 0) expected="in_progress"
      printf "%s|%s|%s|total=%d,completed=%d,in_progress=%d,pending=%d\n", i, intent_status[i], expected, total[i]+0, c[i]+0, p[i]+0, n[i]+0
    }
  }
  ' "$state_file"
)

# 2) Run ID parity: state vs filesystem.
state_runs=$(mktemp)
disk_runs=$(mktemp)
trap 'rm -f "$state_runs" "$disk_runs"' EXIT

awk '
/^runs:/ {in_runs=1; next}
in_runs && /^    - id:/ {print $3}
' "$state_file" | sort -u > "$state_runs"

find .specs-fire/runs -maxdepth 1 -type d -name 'run-*' -printf '%f\n' | sort -u > "$disk_runs"

if ! diff -u "$state_runs" "$disk_runs" >/dev/null; then
  echo "ERROR: run ID mismatch between state and disk"
  diff -u "$state_runs" "$disk_runs" || true
  errors=$((errors + 1))
fi

if [[ $errors -gt 0 ]]; then
  echo "Validation failed with $errors error(s)."
  exit 1
fi

echo "Validation passed: state.yaml is consistent for checked rules."
