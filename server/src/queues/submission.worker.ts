import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

export function startJudgeWorker(): void {
  try {
    const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

    const worker = new Worker(
      'submission-judge',
      async (job) => {
        console.log(`[judge] received job ${job.id} for submission ${job.data.submissionId}`);
      },
      { connection },
    );

    worker.on('error', (err) => {
      console.error('[judge] worker error:', err.message);
    });

    worker.on('failed', (job, err) => {
      console.error(`[judge] job ${job?.id} failed:`, err.message);
    });

    console.log('[judge] submission worker started');
  } catch (error: any) {
    console.error('[judge] failed to start worker:', error.message);
  }
}
