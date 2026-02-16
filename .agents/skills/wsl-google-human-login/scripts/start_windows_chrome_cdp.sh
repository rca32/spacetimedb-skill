#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-9222}"
URL="${2:-https://www.mixamo.com/#/}"
PROFILE_NAME="${3:-mixamo-cdp-profile}"

powershell.exe -NoProfile -Command "& {
  \$port = '$PORT'
  \$url = '$URL'
  \$profileName = '$PROFILE_NAME'
  \$candidates = @(
    '$env:ProgramFiles\Google\Chrome\Application\chrome.exe',
    '$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe',
    '$env:LocalAppData\Google\Chrome\Application\chrome.exe'
  )
  \$chrome = \$candidates | Where-Object { Test-Path \$_ } | Select-Object -First 1
  if (-not \$chrome) {
    Write-Error 'Chrome executable not found on Windows.'
    exit 1
  }
  \$profile = Join-Path \$env:LOCALAPPDATA \$profileName
  New-Item -ItemType Directory -Path \$profile -Force | Out-Null
  Start-Process -FilePath \$chrome -ArgumentList @(
    \"--remote-debugging-port=\$port\",
    \"--user-data-dir=\$profile\",
    \$url
  ) | Out-Null
  Write-Output \"Started Chrome CDP: \$chrome\"
  Write-Output \"Remote debug port: \$port\"
  Write-Output \"User data dir: \$profile\"
}"

echo
echo "If WSL cannot access the port, run this in Windows Admin PowerShell:"
echo "  netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=9223 connectaddress=127.0.0.1 connectport=${PORT} protocol=tcp"
echo "  netsh advfirewall firewall add rule name=\"WSL Chrome CDP 9223\" dir=in action=allow protocol=TCP localport=9223"
