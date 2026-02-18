# Recovery Checklist

## CDP Bridge

1. Confirm Windows browser still runs with `--remote-debugging-port=9222` (or chosen port).
2. Confirm Admin portproxy rule exists:
   - `netsh interface portproxy show v4tov4`
3. Reconnect from WSL:
   - `.agents/skills/wsl-human-cdp-download/scripts/connect_agent_browser_cdp.sh target 9223`

## Auth State

1. If session shows login page again, repeat manual login on Windows browser.
2. Re-run `agent-browser --session target snapshot -i` and confirm account UI appears.
3. Save state when stable:
   - `.agents/skills/wsl-human-cdp-download/scripts/save_session_state.sh target`

## Download Reliability

1. If browser download popups block completion, switch to Linux-side HTTP fetch.
2. Extract required auth material (`localStorage` token, API key, cookies if available).
3. Download into Linux paths directly (`curl`, `bun`, or node fetch).
