import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Problem } from '../models/Problem';
import { ApiError } from '../utils/ApiError';
import { sendSuccess, sendPaginated } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

async function findProblemByIdentifier(identifier: string) {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  if (isObjectId) {
    return Problem.findById(identifier);
  }
  return Problem.findOne({ slug: identifier });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title) || 'problem';
  let slug = baseSlug;
  let suffix = 2;
  while (await Problem.findOne({ slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function serializeProblem(problem: any) {
  return {
    id: problem._id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    tags: problem.tags,
    totalSubmissions: problem.totalSubmissions,
    acceptedSubmissions: problem.acceptedSubmissions,
  };
}

function serializeProblemDetail(problem: any) {
  return {
    ...serializeProblem(problem),
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints,
    sampleInput: problem.sampleInput,
    sampleOutput: problem.sampleOutput,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    createdAt: problem.createdAt,
  };
}

export const listProblems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
  const difficulty = req.query.difficulty as string | undefined;
  const tag = req.query.tag as string | undefined;
  const search = (req.query.search as string | undefined)?.trim();

  const filter: Record<string, unknown> = {};
  if (difficulty) filter.difficulty = new RegExp(`^${difficulty}$`, 'i');
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Problem.countDocuments(filter),
  ]);

  sendPaginated(res, problems.map(serializeProblem), page, limit, total);
});

export const getProblem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const problem = await Problem.findOne({ slug }).lean();
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  sendSuccess(res, serializeProblemDetail(problem));
});

export const createProblem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const existing = await Problem.findOne({ title: req.body.title }).select('_id');
  if (existing) {
    throw ApiError.badRequest('A problem with this title already exists');
  }

  const problem = await Problem.create({
    ...req.body,
    slug: await generateUniqueSlug(req.body.title),
    createdBy: req.user!.id,
  });

  sendSuccess(res, serializeProblemDetail(problem), 201);
});

export const updateProblem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const problem = await findProblemByIdentifier(id);
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  if (req.body.title && req.body.title !== problem.title) {
    problem.slug = await generateUniqueSlug(req.body.title);
  }
  Object.assign(problem, req.body);
  await problem.save();

  sendSuccess(res, serializeProblemDetail(problem));
});

export const deleteProblem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const problem = isObjectId
    ? await Problem.findByIdAndDelete(id)
    : await Problem.findOneAndDelete({ slug: id });
  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }
  sendSuccess(res, { message: 'Problem deleted successfully' });
});
