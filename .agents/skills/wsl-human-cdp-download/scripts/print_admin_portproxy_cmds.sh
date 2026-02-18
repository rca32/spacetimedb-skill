#!/usr/bin/env bash
set -euo pipefail

LISTEN_PORT="${1:-9223}"
CONNECT_PORT="${2:-9222}"

cat <<EOF
Run the following in Windows Admin PowerShell:

sc.exe config iphlpsvc start= auto
sc.exe start iphlpsvc

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=${LISTEN_PORT} connectaddress=127.0.0.1 connectport=${CONNECT_PORT} protocol=tcp
netsh interface portproxy show v4tov4
netsh advfirewall firewall add rule name="WSL Chrome CDP ${LISTEN_PORT}" dir=in action=allow protocol=TCP localport=${LISTEN_PORT}
EOF
