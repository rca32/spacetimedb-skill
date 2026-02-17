#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-mixamo}"
STATE_FILE="${2:-$HOME/.cache/agent-browser/mixamo-auth-state.json}"
MIXAMO_URL="${MIXAMO_URL:-https://www.mixamo.com/#/}"

mkdir -p "$(dirname "$STATE_FILE")"

echo "[1/4] Opening Mixamo in headed browser..."
agent-browser --session "$SESSION_NAME" --headed open "$MIXAMO_URL"
agent-browser --session "$SESSION_NAME" wait 1500

cat <<'EOF'
[2/4] Complete login manually in the opened browser window:
- Click "Log In"
- Choose "Continue with Google"
- Complete CAPTCHA / 2FA if prompted
- Make sure you are back on mixamo.com and signed in
EOF

printf "\nPress Enter after manual login is finished..."
read -r _

echo
echo "[3/4] Checking current URL..."
CURRENT_URL="$(agent-browser --session "$SESSION_NAME" get url)"
echo "Current URL: $CURRENT_URL"

if [[ "$CURRENT_URL" == *"accounts.google.com"* ]]; then
  echo "Still on Google account page. Complete sign-in, then run again."
  exit 1
fi

echo "[4/4] Saving browser state to: $STATE_FILE"
agent-browser --session "$SESSION_NAME" state save "$STATE_FILE"

cat <<EOF

Saved Mixamo auth state.
- Session: $SESSION_NAME
- State file: $STATE_FILE
EOF
