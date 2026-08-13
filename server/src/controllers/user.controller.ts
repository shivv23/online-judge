import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Submission } from '../models/Submission';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getMyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const [totalSubmissions, acceptedSubmissions, solvedResult, verdictResult] = await Promise.all([
    Submission.countDocuments({ userId }),
    Submission.countDocuments({ userId, verdict: 'Accepted' }),
    Submission.aggregate([
      { $match: { userId, verdict: 'Accepted' } },
      { $group: { _id: '$problemId' } },
      { $count: 'count' },
    ]),
    Submission.aggregate([
      { $match: { userId } },
      { $group: { _id: '$verdict', count: { $sum: 1 } } },
    ]),
  ]);

  const solved = solvedResult[0]?.count ?? 0;

  const rankResult = await Submission.aggregate([
    { $match: { verdict: 'Accepted' } },
    { $group: { _id: { userId: '$userId', problemId: '$problemId' } } },
    { $group: { _id: '$_id.userId', solved: { $sum: 1 } } },
    { $match: { solved: { $gt: solved } } },
    { $count: 'count' },
  ]);

  const rank = (rankResult[0]?.count ?? 0) + 1;

  const verdicts: Record<string, number> = {};
  for (const v of verdictResult as Array<{ _id: string; count: number }>) {
    verdicts[v._id] = v.count;
  }

  sendSuccess(res, {
    totalSubmissions,
    acceptedSubmissions,
    solvedProblems: solved,
    rank,
    verdicts,
  });
});
