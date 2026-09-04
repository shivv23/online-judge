#!/bin/bash
# Registers the DuckDNS updater to run every 5 minutes.
# Writes an /etc/cron.d entry (root-owned, mode 0644) so it survives reboot
# without depending on a user crontab.
# Requires: DUCKDNS_DOMAINS and DUCKDNS_TOKEN set in the repo .env file.

set -e
REPO_DIR="/home/ubuntu/online-judge"
SCRIPT="$REPO_DIR/deploy/duckdns-update.sh"
CRON_FILE="/etc/cron.d/duckdns-update"

CONTENT=$'SHELL=/bin/bash\n*/5 * * * * root '"$SCRIPT"$' >> /var/log/duckdns-update.log 2>&1\n'

sudo rm -f "$CRON_FILE"
sudo install -o root -g root -m 0644 /dev/stdin "$CRON_FILE" <<< "$CONTENT"

echo "Installed $CRON_FILE:"
sudo cat "$CRON_FILE"
echo
echo "Cron service status:"
systemctl is-active cron 2>/dev/null || service cron status 2>&1 | head -3 || true

echo "--- test run ---"
bash "$SCRIPT"