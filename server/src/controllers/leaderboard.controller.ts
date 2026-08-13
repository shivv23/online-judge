import { Request, Response } from 'express';
import { Submission } from '../models/Submission';
import { sendPaginated } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);

  const [entries, totalResult] = await Promise.all([
    Submission.aggregate([
      { $match: { verdict: 'Accepted' } },
      {
        $group: {
          _id: { userId: '$userId', problemId: '$problemId' },
          accepted: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.userId',
          solved: { $sum: 1 },
          totalAccepted: { $sum: '$accepted' },
        },
      },
      { $sort: { solved: -1, totalAccepted: -1, _id: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          avatar: '$user.avatar',
          solved: 1,
          totalAccepted: 1,
        },
      },
    ]),
    Submission.aggregate([
      { $match: { verdict: 'Accepted' } },
      { $group: { _id: { userId: '$userId', problemId: '$problemId' } } },
      { $group: { _id: '$_id.userId' } },
      { $count: 'count' },
    ]),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const data = (entries as Array<{
    userId: unknown;
    username: string;
    avatar?: string;
    solved: number;
    totalAccepted: number;
  }>).map((entry, index) => ({
    rank: (page - 1) * limit + index + 1,
    userId: String(entry.userId),
    username: entry.username,
    avatar: entry.avatar ?? null,
    solved: entry.solved,
    totalAccepted: entry.totalAccepted,
  }));

  sendPaginated(res, data, page, limit, total);
});
