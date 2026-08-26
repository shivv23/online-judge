#!/usr/bin/env bash
# Oracle Cloud Free Tier deployment script
# Run this ONCE on your Oracle Cloud Ubuntu instance
# Usage: bash oracle-setup.sh [your-domain.com]
set -euo pipefail

DOMAIN="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="/home/ubuntu/online-judge"

echo "============================================"
echo "  Online Judge — Oracle Cloud Setup"
echo "============================================"

# 1. System update + Docker
echo ""
echo "[1/8] Installing Docker..."
sudo apt-get update -qq
sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq
sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 2. Docker Compose standalone
echo "[2/8] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
else
  echo "  Docker Compose already installed"
fi

# 3. Firewall
echo "[3/8] Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Clone or pull repo
echo "[4/8] Setting up repository..."
if [ ! -d "$REPO_DIR" ]; then
  git clone https://github.com/shivv23/online-judge.git "$REPO_DIR"
fi
cd "$REPO_DIR"
git pull origin master

# 5. Generate JWT secret
echo "[5/8] Generating secrets..."
JWT_SECRET=$(openssl rand -hex 32)
if [ ! -f .env ]; then
  cat > .env <<EOF
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/online-judge
REDIS_URL=redis://redis:6379
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
COMPOSE_PROJECT_NAME=online-judge
EOF
  echo "  .env created with generated JWT_SECRET"
else
  echo "  .env already exists — skipping"
fi

# 6. Pre-pull judge Docker images
echo "[6/8] Pulling judge Docker images (this takes a few minutes)..."
docker pull gcc:14 2>/dev/null || echo "  gcc:14 pull failed (non-critical)"
docker pull python:3.12-slim 2>/dev/null || echo "  python:3.12-slim pull failed (non-critical)"
docker pull node:22-alpine 2>/dev/null || echo "  node:22-alpine pull failed (non-critical)"
docker pull eclipse-temurin:21-jdk 2>/dev/null || echo "  eclipse-temurin:21-jdk pull failed (non-critical)"

# 7. Build and start services
echo "[7/8] Building and starting services..."
docker-compose up -d --build

# 8. SSL setup (optional)
if [ -n "$DOMAIN" ]; then
  echo "[8/8] Setting up SSL for ${DOMAIN}..."
  sudo apt-get install -y -qq certbot python3-certbot-nginx
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" || {
    echo "  SSL setup failed — you can retry later with:"
    echo "  sudo certbot --nginx -d ${DOMAIN}"
  }
  # Auto-renew cron
  (sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | sudo crontab - 2>/dev/null || true
else
  echo "[8/8] Skipping SSL (no domain provided)"
  echo "  To set up SSL later: bash deploy/oracle-setup.sh your-domain.com"
fi

# 9. Create deploy update script
echo ""
echo "Creating deploy-update.sh for future updates..."
cat > "$REPO_DIR/deploy/deploy-update.sh" <<'UPDATE_SCRIPT'
#!/usr/bin/env bash
# Quick update script — pull latest and rebuild
set -euo pipefail
cd /home/ubuntu/online-judge
echo "Pulling latest changes..."
git pull origin master
echo "Rebuilding and restarting..."
docker-compose up -d --build
echo "Done! Services restarted."
UPDATE_SCRIPT
chmod +x "$REPO_DIR/deploy/deploy-update.sh"

# Done
PUBLIC_IP=$(curl -s ifconfig.me)
echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "  App URL: http://${PUBLIC_IP}"
if [ -n "$DOMAIN" ]; then
  echo "  SSL URL: https://${DOMAIN}"
fi
echo ""
echo "  Useful commands:"
echo "    cd ~/online-judge"
echo "    docker-compose logs -f server     # Watch server logs"
echo "    docker-compose logs -f             # All logs"
echo "    docker-compose down                # Stop all services"
echo "    docker-compose up -d --build       # Rebuild and restart"
echo "    bash deploy/deploy-update.sh       # Quick update"
echo "    docker-compose exec server sh      # Shell into server"
