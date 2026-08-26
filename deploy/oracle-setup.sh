#!/usr/bin/env bash
# Oracle Cloud Free Tier deployment script
# Run this ONCE on your Oracle Cloud Ubuntu instance
# Usage: bash oracle-setup.sh
set -euo pipefail

echo "=== Online Judge — Oracle Cloud Setup ==="

# 1. System update + Docker
echo "[1/6] Installing Docker..."
sudo apt-get update -qq
sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq
sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 2. Install Docker Compose (standalone)
echo "[2/6] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Firewall
echo "[3/6] Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Clone and configure
echo "[4/6] Cloning repository..."
cd /home/ubuntu
if [ ! -d "online-judge" ]; then
  git clone https://github.com/shivv23/online-judge.git
fi
cd online-judge

# 5. Generate JWT secret
echo "[5/6] Generating secrets..."
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
  echo ".env created with generated JWT_SECRET"
else
  echo ".env already exists — skipping"
fi

# 6. Build and start
echo "[6/6] Building and starting services..."
git pull origin master
sudo docker-compose up -d --build

echo ""
echo "=== Deployment Complete ==="
echo "App is running at: http://$(curl -s ifconfig.me)"
echo ""
echo "Useful commands:"
echo "  cd ~/online-judge"
echo "  docker-compose logs -f server    # Watch server logs"
echo "  docker-compose down              # Stop all services"
echo "  docker-compose up -d --build     # Rebuild and restart"
echo "  docker-compose exec server sh    # Shell into server"
