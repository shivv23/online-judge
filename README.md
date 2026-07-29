# Online Judge

A full-stack scalable Online Judge platform built with the MERN stack. Users can browse programming problems, write and submit code in multiple languages, and receive automated verdicts based on test case evaluation.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Monaco Editor
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB with Mongoose
- **Code Execution:** Docker containers with resource isolation
- **Job Queue:** BullMQ with Redis

## Project Structure

```
online-judge/
├── client/          # React frontend
├── server/          # Express API server
├── .gitignore
├── .prettierrc
├── eslint.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Docker (for code execution)
- Redis (for job queue)

### Installation

```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd client && npm install

# Start development servers
cd server && npm run dev
cd client && npm run dev
```
