FROM node:22-alpine AS builder
WORKDIR /app
COPY server/package*.json ./server/
COPY server/tsconfig.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
RUN cd server && npm run build

FROM node:22-alpine
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./
ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1
CMD ["node", "dist/index.js"]
