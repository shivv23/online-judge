# Online Judge

A full-stack competitive programming platform with Docker-based code execution.

![Node](https://img.shields.io/badge/Node.js-22-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Monaco Editor |
| Backend | Express, TypeScript, Mongoose |
| Database | MongoDB 7 |
| Queue | BullMQ + Redis 7 |
| Judge | Docker (gcc, Python, Node, OpenJDK) |
| CI | GitHub Actions |
| Deploy | Docker Compose, Nginx, Oracle Cloud |

## Features

- User registration & JWT authentication
- Problem CRUD with difficulty levels, tags, and search
- Multi-language code editor (C, C++, Python, Java, JavaScript) via Monaco
- Secure Docker sandbox execution with resource limits
- Real-time verdict polling (Accepted, Wrong Answer, TLE, Runtime/Compile Error)
- Leaderboard and per-user statistics
- Admin panel for problem management
- Rate limiting, helmet security headers, structured error handling

## Quick Start (Development)

### Prerequisites
- Node.js 22+
- Docker Desktop
- MongoDB (or Docker)
- Redis (or Docker)

### 1. Start databases
```bash
docker run -d --name oj-mongo -p 27017:27017 mongo:7
docker run -d --name oj-redis -p 6379:6379 redis:7-alpine
```

### 2. Backend
```bash
cd server
cp ../.env.example .env
npm install
npm run seed      # seed sample problems
npm run dev       # starts on :5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev       # starts on :3000 (proxies /api to :5000)
```

### 4. Pull judge Docker images
```bash
docker pull gcc:14
docker pull python:3.12-slim
docker pull node:22-alpine
docker pull eclipse-temurin:21-jdk
```

## Production (Docker Compose)

```bash
cp .env.example .env        # set a strong JWT_SECRET
docker-compose up -d --build
# App at http://localhost
```

## Oracle Cloud Deployment

### First-time setup
```bash
# SSH into your Oracle Cloud Ubuntu instance, then:
git clone https://github.com/shivv23/online-judge.git
cd online-judge
bash deploy/oracle-setup.sh                    # no SSL
bash deploy/oracle-setup.sh judge.yourdomain.com  # with SSL
```

### Subsequent updates
```bash
bash deploy/deploy-update.sh
```

### What the setup script does
1. Installs Docker and Docker Compose
2. Configures firewall (ports 22, 80, 443)
3. Clones the repo and generates JWT secrets
4. Pre-pulls judge Docker images (gcc, Python, Node, JDK)
5. Builds and starts all services via Docker Compose
6. Optionally sets up SSL via Let's Encrypt

## Testing

### Backend (26 tests)
```bash
cd server
npm test              # Jest + Supertest + mongodb-memory-server
```

### Frontend (23 tests)
```bash
cd client
npm test              # Vitest + React Testing Library
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | — | Register |
| POST | /api/v1/auth/login | — | Login |
| GET | /api/v1/auth/me | ✓ | Current user |
| GET | /api/v1/problems | — | List problems (paginated, filterable) |
| GET | /api/v1/problems/:slug | — | Problem detail |
| POST | /api/v1/problems | Admin | Create problem |
| PUT | /api/v1/problems/:id | Admin | Update problem |
| DELETE | /api/v1/problems/:id | Admin | Delete problem |
| POST | /api/v1/submissions | ✓ | Submit code |
| GET | /api/v1/submissions/:id | ✓ | Get submission |
| GET | /api/v1/submissions/user/:id | ✓ | User's submissions |
| GET | /api/v1/leaderboard | — | Global rankings |
| GET | /api/v1/users/me/stats | ✓ | Personal stats |
| POST | /api/v1/compile | ✓ | Run code with custom input |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| MONGO_URI | mongodb://localhost:27017/online-judge | MongoDB connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| JWT_SECRET | — (required in prod) | JWT signing secret |
| JWT_EXPIRES_IN | 7d | Token lifetime |
| NODE_ENV | development | Environment mode |

## Project Structure

```
online-judge/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/            # Axios API layer
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context provider
│   │   ├── pages/          # Route pages
│   │   ├── types/          # TypeScript types
│   │   └── __tests__/      # Frontend tests (Vitest)
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Env, database config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── models/         # Mongoose schemas
│   │   ├── queues/         # BullMQ job queues
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Compiler/execution engine
│   │   ├── validations/    # Joi schemas
│   │   ├── workers/        # Background job processors
│   │   └── __tests__/      # Backend tests (Jest)
│   ├── Dockerfile
│   └── package.json
├── deploy/                 # Deployment scripts
├── nginx/                  # Nginx configuration
├── docker-compose.yml
└── .github/workflows/      # CI/CD
```

## License

MIT
