import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { TestCase } from '../models/TestCase';
import { Problem } from '../models/Problem';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

function findProblemByIdentifier(identifier: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  if (isObjectId) {
    return Problem.findById(identifier);
  }
  return Problem.findOne({ slug: identifier });
}

function serializeTestCase(testCase: any) {
  return {
    id: testCase._id,
    problemId: testCase.problemId,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    isHidden: testCase.isHidden,
    order: testCase.order,
    createdAt: testCase.createdAt,
  };
}

export const listTestCases = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const problem = await findProblemByIdentifier(req.params.problemId);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  const filter: Record<string, unknown> = { problemId: problem._id };
  if (!req.user || req.user.role !== 'admin') {
    filter.isHidden = false;
  }

  const testCases = await TestCase.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  sendSuccess(res, testCases.map(serializeTestCase));
});

export const createTestCase = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const problem = await findProblemByIdentifier(req.params.problemId);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  const testCase = await TestCase.create({
    ...req.body,
    problemId: problem._id,
  });

  sendSuccess(res, serializeTestCase(testCase), 201);
});

export const deleteTestCase = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.notFound('Test case not found');
  }
  const testCase = await TestCase.findByIdAndDelete(id);
  if (!testCase) {
    throw ApiError.notFound('Test case not found');
  }
  sendSuccess(res, { message: 'Test case deleted successfully' });
});
