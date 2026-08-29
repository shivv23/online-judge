#!/bin/bash
set -e

DOMAIN="$1"
if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

echo "=== Enabling SSL for $DOMAIN ==="
cd /home/ubuntu/online-judge

echo "--- Step 1: Install certbot ---"
sudo apt-get install -y -qq certbot > /dev/null 2>&1 || sudo snap install certbot --classic

echo "--- Step 2: Create certbot webroot ---"
mkdir -p certbot/www

echo "--- Step 3: Validate DNS resolves to this host ---"
RESOLVED_IP=$(dig +short "$DOMAIN" A | head -1)
echo "  $DOMAIN -> ${RESOLVED_IP:-<no A record>}"
if [ -z "$RESOLVED_IP" ]; then
  echo "  ERROR: No A record found. Set the IP in DuckDNS first." >&2
  exit 1
fi

echo "--- Step 4: Recreate client container with SSL config + certbot volume ---"
sudo docker compose -f docker-compose.yml -f docker-compose.micro.yml up -d client

echo "--- Step 5: Obtain Let's Encrypt certificate ---"
sudo certbot certonly --webroot -w /home/ubuntu/online-judge/certbot/www \
  -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email \
  --renew-by-default

echo "--- Step 6: Verify certificate ---"
sudo ls -la /etc/letsencrypt/live/"$DOMAIN/"

echo "--- Step 7: Reload nginx to serve HTTPS ---"
sudo docker exec online-judge-client-1 nginx -s reload || sudo docker restart online-judge-client-1

echo "--- Step 8: Update server CORS origins ---"
sudo sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://129.225.105.207,https://${DOMAIN}|" .env
sudo docker compose -f docker-compose.yml -f docker-compose.micro.yml up -d server

echo ""
echo "=== SSL ENABLED ==="
echo "  Site:  https://${DOMAIN}"
echo "  HTTP requests will now redirect to HTTPS."