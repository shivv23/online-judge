import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

const connection = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('[judge] redis connection error:', err.message);
});

export const submissionQueue = new Queue('submission-judge', { connection });

export async function enqueueSubmission(submissionId: string): Promise<void> {
  await submissionQueue.add(
    'evaluate',
    { submissionId },
    { removeOnComplete: true, removeOnFail: 1000 },
  );
}
