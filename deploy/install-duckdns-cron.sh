#!/bin/bash
# Registers the DuckDNS updater to run every 5 minutes.
# Requires: DUCKDNS_DOMAINS and DUCKDNS_TOKEN set in the repo .env file.

set -e
REPO_DIR="/home/ubuntu/online-judge"
SCRIPT="$REPO_DIR/deploy/duckdns-update.sh"

chmod +x "$SCRIPT"

CRON_LINE="*/5 * * * * $SCRIPT >> /var/log/duckdns-update.log 2>&1"

# Remove any existing line for this script, then add fresh
(crontab -l 2>/dev/null | grep -v "duckdns-update.sh" || true)
( (crontab -l 2>/dev/null | grep -v "duckdns-update.sh") ; echo "$CRON_LINE" ) | crontab -

echo "Installed cron: $CRON_LINE"
echo "Current crontab:"
crontab -l 2>/dev/null | grep duckdns

# Run once now to validate token/domains
echo "--- test run ---"
bash "$SCRIPT"