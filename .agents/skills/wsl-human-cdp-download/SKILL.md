---
name: wsl-human-cdp-download
description: Human-in-the-loop workflow for WSL when agent-browser is blocked by OAuth, CAPTCHA, 2FA, or browser download restrictions. Use when automation in WSL cannot complete login or download reliably. Bridges WSL to Windows Chrome/Edge via CDP, reconnects agent-browser to authenticated Windows sessions, and provides Linux-first patterns for reliable scraping and file capture.
---

# WSL Human CDP Download

## Overview

Use this skill when normal WSL browser automation fails because target sites reject the Linux runtime or force human verification.
Solve this by logging in manually on Windows browser, then continue automation from WSL through CDP.

## Workflow: WSL Blocked Login Recovery

1. Start Windows browser in CDP mode from WSL.
```bash
.agents/skills/wsl-human-cdp-download/scripts/start_windows_browser_cdp.sh 9222 "https://target-site.example/"
```

2. Ask user to complete manual login in the opened Windows browser.
- Complete all CAPTCHA and 2FA steps.
- Confirm account/profile menu is visible.

3. Ask user to run Admin PowerShell bridge commands.
```bash
.agents/skills/wsl-human-cdp-download/scripts/print_admin_portproxy_cmds.sh 9223 9222
```

4. Connect agent-browser from WSL to Windows browser session.
```bash
.agents/skills/wsl-human-cdp-download/scripts/connect_agent_browser_cdp.sh target 9223
```

5. Verify authenticated state before scraping.
```bash
agent-browser --session target get url
agent-browser --session target snapshot -i
```

6. Continue normal agent-browser automation on the connected session.
- Navigate, click, scrape, or run eval actions.
- Keep the Windows browser window open during automation.

## Workflow: Reliable Linux Download Strategy

Use this path when browser downloads are blocked or disappear.

1. Extract auth material from session.
```bash
.agents/skills/wsl-human-cdp-download/scripts/extract_localstorage_value.sh target access_token
.agents/skills/wsl-human-cdp-download/scripts/save_session_state.sh target "$HOME/.cache/agent-browser/target-state.json"
```

2. Replay API/file requests from Linux (`curl`, `bun`, or node fetch).
- Reuse required headers (`Authorization`, site API key, cookies as needed).
- Write outputs directly into Linux project paths.

3. Use browser download manager only as fallback.

## Resources (optional)

### scripts/
- `start_windows_browser_cdp.sh`
- `print_admin_portproxy_cmds.sh`
- `connect_agent_browser_cdp.sh`
- `extract_localstorage_value.sh`
- `save_session_state.sh`

### references/
- `recovery-checklist.md`

## Recovery Rules

- If CDP connect fails with endpoint unreachable:
  - Keep Windows browser running with `--remote-debugging-port`.
  - Re-apply Admin `netsh interface portproxy` rules.
- If snapshot shows `chrome-error://chromewebdata/`:
  - Open target URL again and wait for network idle.
- If command fails with socket permission errors in WSL sandbox:
  - Re-run command with required permission escalation.
- If login loops back to OAuth reject page:
  - Repeat manual login in Windows browser and reconnect session.
