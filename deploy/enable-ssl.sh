#!/bin/bash
set -e

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

echo "=== Enabling SSL for $DOMAIN ==="
cd /home/ubuntu/online-judge

CLIENT="online-judge-client-1"

echo "--- Step 1: Install certbot ---"
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get install -y -qq certbot > /dev/null 2>&1 || sudo snap install certbot --classic
fi

echo "--- Step 2: Validate DNS resolves to this host ---"
RESOLVED_IP=$(dig +short "$DOMAIN" A | head -1)
echo "  $DOMAIN -> ${RESOLVED_IP:-<no A record>}"
if [ -z "$RESOLVED_IP" ]; then
  echo "  ERROR: No A record found. Set the IP in DuckDNS first." >&2
  exit 1
fi
if [ "$RESOLVED_IP" != "129.225.105.207" ]; then
  echo "  ERROR: $DOMAIN resolves to $RESOLVED_IP, not 129.225.105.207. Fix DuckDNS." >&2
  exit 1
fi

echo "--- Step 3: Stop client container so certbot can bind port 80 ---"
sudo docker stop "$CLIENT" 2>/dev/null || true

echo "--- Step 4: Obtain Let's Encrypt certificate (standalone) ---"
sudo certbot certonly --standalone -d "$DOMAIN" \
  --non-interactive --agree-tos --register-unsafely-without-email \
  --preferred-challenges http --force-renewal

echo "--- Step 5: Start client container (now serves HTTPS on 443 + redirect on 80) ---"
sudo docker start "$CLIENT"

echo "--- Step 6: Update server CORS origins ---"
sudo sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://129.225.105.207,https://${DOMAIN}|" .env
sudo docker compose -f docker-compose.yml -f docker-compose.micro.yml up -d server

echo ""
echo "=== SSL ENABLED ==="
echo "  Site:  https://${DOMAIN}"
echo "  HTTP requests now redirect to HTTPS."