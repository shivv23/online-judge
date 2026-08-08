import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { startJudgeWorker } from './queues/submission.worker';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use('/api/v1', routes);

app.use(errorHandler);

async function start(): Promise<void> {
  await connectDatabase();
  startJudgeWorker();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

start();
