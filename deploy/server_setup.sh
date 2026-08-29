#!/bin/bash
set -e

echo "=== Step 1: System updates ==="
sudo apt-get update -qq
sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release git

echo "=== Step 2: Docker install ==="
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

ARCH=$(dpkg --print-architecture)
CODENAME=$(lsb_release -cs)
echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -qq
sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu

echo "=== Step 3: Docker version ==="
docker --version
docker compose version

echo "=== Step 4: Git clone ==="
cd /home/ubuntu
if [ ! -d "online-judge" ]; then
    git clone https://github.com/shivv23/online-judge.git
fi

echo "=== Step 5: Setup .env ==="
cd /home/ubuntu/online-judge
JWT_SECRET=$(openssl rand -hex 32)
cat > .env << ENVEOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:27017/online-judge
REDIS_URL=redis://redis:6379
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://129.225.105.207
ENVEOF
echo ".env created"

echo "=== Step 6: Deploy with Docker Compose ==="
sudo docker compose -f docker-compose.yml -f docker-compose.micro.yml up -d --build --remove-orphans

echo "=== Step 7: Wait for services ==="
sleep 15

echo "=== Step 8: Status ==="
sudo docker compose ps
echo ""
echo "=== Step 9: Health Check ==="
curl -s http://localhost:5000/api/v1/health || echo "Server not ready yet, waiting more..."
sleep 10
curl -s http://localhost:5000/api/v1/health || echo "Still starting..."

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Public IP: 129.225.105.207"
echo "API: http://129.225.105.207:5000/api/v1"
echo "Health: http://129.225.105.207:5000/api/v1/health"
