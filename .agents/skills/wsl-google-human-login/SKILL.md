---
name: wsl-google-human-login
description: Human-in-the-loop Google/OAuth login workflow for WSL environments using agent-browser. Use when automated login fails with messages like "This browser or app may not be secure" and an AI agent must continue browser automation after a user manually signs in on Windows Chrome via CDP bridge.
---

# WSL Google Human Login

## Overview

Use this skill when OAuth providers (especially Google) block agent-browser sign-in in WSL.  
Run login in Windows Chrome, then bridge CDP back to WSL so automation can continue in the authenticated session.

## Workflow

1. Detect block condition:
- Error text includes `This browser or app may not be secure`.
- Re-trying inside agent-browser keeps redirecting to `accounts.google.com/.../signin/rejected`.

2. Start Windows Chrome in CDP mode from WSL:
```bash
./scripts/start_windows_chrome_cdp.sh 9222 https://www.mixamo.com/#/
```

3. Ask user to complete login manually in the opened Windows Chrome:
- Click Google login.
- Complete CAPTCHA / 2FA.
- Confirm user account menu is visible on target site.

4. Ask user to run admin PowerShell bridge commands:
```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=9223 connectaddress=127.0.0.1 connectport=9222 protocol=tcp
netsh advfirewall firewall add rule name="WSL Chrome CDP 9223" dir=in action=allow protocol=TCP localport=9223
```

5. Connect agent-browser from WSL to the Windows Chrome session:
```bash
./scripts/connect_agent_browser_cdp.sh mixamo 9223
```

6. Verify authenticated state:
```bash
agent-browser --session mixamo get url
agent-browser --session mixamo snapshot -i
```
- Success signal: site shows account/profile menu, not `Log In`.

7. Save state for reuse (optional):
```bash
mkdir -p "$HOME/.cache/agent-browser"
agent-browser --session mixamo state save "$HOME/.cache/agent-browser/mixamo-auth-state.json"
```

## Recovery Rules

If WSL cannot reach CDP endpoint:
- Run:
```bash
./scripts/connect_agent_browser_cdp.sh mixamo 9223
```
- If it prints unreachable endpoint:
  - Confirm `netsh interface portproxy show v4tov4` contains `0.0.0.0:9223 -> 127.0.0.1:9222`.
  - Confirm admin PowerShell was used.
  - Confirm Windows Chrome still runs with `--remote-debugging-port=9222`.

If a stale rule exists:
```powershell
netsh interface portproxy delete v4tov4 listenport=9223 listenaddress=0.0.0.0
```
Then add again.

## Scripts

- `scripts/start_windows_chrome_cdp.sh`: Launch Windows Chrome from WSL with remote debugging.
- `scripts/print_admin_portproxy_cmds.sh`: Print exact admin PowerShell commands.
- `scripts/connect_agent_browser_cdp.sh`: Resolve WSL host IP, fetch websocket debugger URL, and connect agent-browser.
