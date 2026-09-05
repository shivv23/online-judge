import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { Submission, SubmissionVerdict } from '../models/Submission';
import { Problem } from '../models/Problem';
import { TestCase } from '../models/TestCase';
import { compileCode, disposeSession, runCompiled, createExecSession, destroyExecSession, resetExecSession, runCompiledInSession, type ExecSession } from '../services/compiler.service';

function normalizeOutput(output: string): string {
  return output.trim().replace(/\s+/g, ' ');
}

export async function evaluateSubmission(submissionId: string): Promise<void> {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }
  if (submission.verdict !== 'Pending') {
    return;
  }

  const testCases = await TestCase.find({ problemId: submission.problemId }).sort({ order: 1 });
  const totalTestCases = testCases.length;
  if (totalTestCases === 0) {
    throw new Error(`Problem ${submission.problemId} has no test cases`);
  }

  let verdict: SubmissionVerdict = 'Accepted';
  let errorMessage = '';
  let testCasesPassed = 0;
  let executionTimeMs = 0;

  const session = await compileCode({
    language: submission.language,
    code: submission.code,
  });
  let execSession: ExecSession | null = null;
  try {
    if (session.status === 'compile_error') {
      verdict = 'Compile Error';
      errorMessage = session.stderr.slice(0, 4000);
    } else if (session.status === 'timeout') {
      verdict = 'Time Limit Exceeded';
      errorMessage = session.stderr.slice(0, 4000);
    } else {
      try {
        execSession = await createExecSession(submission.language, session.workDir);
      } catch (error: any) {
        console.warn(`[judge] exec session unavailable, falling back to per-case runs: ${error.message}`);
      }

      for (const testCase of testCases) {
        const req = {
          language: submission.language,
          code: submission.code,
          input: testCase.input,
        };
        const result = execSession
          ? await runCompiledInSession(execSession, req)
          : await runCompiled(session, req);
        executionTimeMs = Math.max(executionTimeMs, result.executionTimeMs);

        if (result.status === 'timeout') {
          verdict = 'Time Limit Exceeded';
          break;
        }
        if (result.status === 'runtime_error') {
          verdict = 'Runtime Error';
          errorMessage = result.stderr.slice(0, 4000);
          break;
        }
        if (normalizeOutput(result.stdout) !== normalizeOutput(testCase.expectedOutput)) {
          verdict = 'Wrong Answer';
          break;
        }
        testCasesPassed += 1;
        if (execSession) {
          await resetExecSession(execSession, submission.language);
        }
      }
    }
  } finally {
    if (execSession) {
      await destroyExecSession(execSession);
    }
    await disposeSession(session);
  }

  submission.verdict = verdict;
  submission.testCasesPassed = testCasesPassed;
  submission.totalTestCases = totalTestCases;
  submission.executionTimeMs = executionTimeMs;
  submission.errorMessage = errorMessage;
  await submission.save();

  const increment: Record<string, number> = { totalSubmissions: 1 };
  if (verdict === 'Accepted') {
    increment.acceptedSubmissions = 1;
  }
  await Problem.findByIdAndUpdate(submission.problemId, { $inc: increment });
}

export function startJudgeWorker(): void {
  try {
    const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

    const worker = new Worker(
      'submission-judge',
      async (job) => {
        console.log(`[judge] evaluating submission ${job.data.submissionId} (job ${job.id})`);
        await evaluateSubmission(job.data.submissionId);
        console.log(`[judge] finished submission ${job.data.submissionId} (job ${job.id})`);
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
