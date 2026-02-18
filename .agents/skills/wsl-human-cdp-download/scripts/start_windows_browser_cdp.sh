#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-9222}"
URL="${2:-https://example.com/}"
PROFILE_NAME="${3:-wsl-cdp-profile}"

powershell.exe -NoProfile -Command "& {
  \$port = '$PORT'
  \$url = '$URL'
  \$profileName = '$PROFILE_NAME'
  \$candidates = @(
    \"\$env:ProgramFiles\Google\Chrome\Application\chrome.exe\",
    \"\$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe\",
    \"\$env:LocalAppData\Google\Chrome\Application\chrome.exe\",
    \"\$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\",
    \"\$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe\",
    \"\$env:LocalAppData\Microsoft\Edge\Application\msedge.exe\"
  )
  \$browser = \$candidates | Where-Object { Test-Path \$_ } | Select-Object -First 1
  if (-not \$browser) {
    Write-Error 'Chrome/Edge executable not found on Windows.'
    exit 1
  }
  \$profile = Join-Path \$env:LOCALAPPDATA \$profileName
  New-Item -ItemType Directory -Path \$profile -Force | Out-Null
  Start-Process -FilePath \$browser -ArgumentList @(
    \"--remote-debugging-port=\$port\",
    \"--user-data-dir=\$profile\",
    \$url
  ) | Out-Null
  Write-Output \"Started browser: \$browser\"
  Write-Output \"Remote debug port: \$port\"
  Write-Output \"User data dir: \$profile\"
}"

echo
echo "If WSL cannot access the CDP port, apply Admin PowerShell portproxy rules:"
echo "  .agents/skills/wsl-human-cdp-download/scripts/print_admin_portproxy_cmds.sh 9223 ${PORT}"
