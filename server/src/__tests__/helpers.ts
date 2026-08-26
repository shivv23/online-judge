import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../routes';
import { errorHandler } from '../middleware/errorHandler';

export async function createTestApp(): Promise<express.Express> {
  await mongoose.connect(process.env.MONGO_URI!);

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1', routes);
  app.use(errorHandler);

  return app;
}

export async function closeDb(): Promise<void> {
  await mongoose.disconnect();
}
