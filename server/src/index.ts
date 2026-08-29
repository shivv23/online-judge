import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { startJudgeWorker } from './queues/submission.worker';
import { cleanupOrphanContainers } from './services/compiler.service';

const app = express();

app.set('trust proxy', 1); // nginx sits in front; use client IP from X-Forwarded-For

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(rateLimiter);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  await cleanupOrphanContainers();
  await connectDatabase();
  startJudgeWorker();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaught exception:', err);
  process.exit(1);
});

const shutdownSignals = ['SIGTERM', 'SIGINT'] as const;
for (const signal of shutdownSignals) {
  process.on(signal, () => {
    console.log(`\n[${signal}] shutting down gracefully…`);
    process.exit(0);
  });
}

start();
