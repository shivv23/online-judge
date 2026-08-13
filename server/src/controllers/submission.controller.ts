import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Submission } from '../models/Submission';
import { Problem } from '../models/Problem';
import { ApiError } from '../utils/ApiError';
import { sendSuccess, sendPaginated } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { enqueueSubmission } from '../queues/submission.queue';

function serializeSubmission(submission: any) {
  return {
    id: submission._id,
    userId: submission.userId,
    problemId: submission.problemId,
    language: submission.language,
    verdict: submission.verdict,
    executionTimeMs: submission.executionTimeMs,
    memoryUsedKB: submission.memoryUsedKB,
    testCasesPassed: submission.testCasesPassed,
    totalTestCases: submission.totalTestCases,
    errorMessage: submission.errorMessage,
    createdAt: submission.createdAt,
  };
}

function serializeSubmissionWithProblem(submission: any) {
  const problem = submission.problemId;
  return {
    ...serializeSubmission(submission),
    problem:
      problem && problem._id
        ? {
            id: String(problem._id),
            title: problem.title,
            slug: problem.slug,
            difficulty: problem.difficulty,
          }
        : null,
  };
}

export const createSubmission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { problemId, language, code } = req.body;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    throw ApiError.notFound('Problem not found');
  }
  const problem = await Problem.findById(problemId).select('_id');
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  const submission = await Submission.create({
    userId: req.user!.id,
    problemId,
    language,
    code,
    verdict: 'Pending',
  });

  try {
    await enqueueSubmission(submission.id);
  } catch (error) {
    console.error('[judge] failed to enqueue submission:', error);
  }

  sendSuccess(res, serializeSubmission(submission), 201);
});

export const getSubmission = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound('Submission not found');
  }
  const submission = await Submission.findById(id);
  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }
  if (
    submission.userId.toString() !== req.user!.id.toString() &&
    req.user!.role !== 'admin'
  ) {
    throw ApiError.forbidden('You can only view your own submissions');
  }
  sendSuccess(res, serializeSubmission(submission));
});

export const listUserSubmissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    if (userId !== req.user!.id.toString() && req.user!.role !== 'admin') {
      throw ApiError.forbidden('You can only view your own submissions');
    }

    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);

    const filter = { userId };
    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('problemId', 'title slug difficulty')
        .lean(),
      Submission.countDocuments(filter),
    ]);

    sendPaginated(
      res,
      submissions.map(serializeSubmissionWithProblem),
      page,
      limit,
      total,
    );
  },
);
