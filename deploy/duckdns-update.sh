#!/bin/bash
# Keep the DuckDNS record pointed at this host's current public IP.
# Reads DUCKDNS_DOMAINS and DUCKDNS_TOKEN from the repo .env file.
# Install: add to root's crontab via deploy/install-duckdns-cron.sh

set -u
REPO_DIR="/home/ubuntu/online-judge"

if [ -f "$REPO_DIR/.env" ]; then
  # shellcheck disable=SC1091
  . "$REPO_DIR/.env"
fi

DOMAINS="${DUCKDNS_DOMAINS:-}"
TOKEN="${DUCKDNS_TOKEN:-}"

if [ -z "$DOMAINS" ] || [ -z "$TOKEN" ]; then
  echo "duckdns-update: DUCKDNS_DOMAINS or DUCKDNS_TOKEN missing in .env" >&2
  exit 1
fi

PUBLIC_IP="$(curl -sS --max-time 10 https://api.ipify.org 2>/dev/null || true)"
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP="$(curl -sS --max-time 10 https://ifconfig.me 2>/dev/null || true)"
fi
if [ -z "$PUBLIC_IP" ]; then
  echo "duckdns-update: could not determine public IP" >&2
  exit 1
fi

UPDATE_URL="https://www.duckdns.org/update?domains=${DOMAINS}&token=${TOKEN}&ip=${PUBLIC_IP}"

RESP=$(curl -sS --max-time 20 "$UPDATE_URL" 2>/dev/null)

case "$RESP" in
  OK)
    echo "duckdns-update: $DOMAINS -> $PUBLIC_IP (OK)"
    ;;
  KO|"")
    echo "duckdns-update: FAILED for $DOMAINS (response='$RESP')" >&2
    exit 1
    ;;
  *)
    echo "duckdns-update: unexpected response '$RESP'" >&2
    exit 1
    ;;
esac