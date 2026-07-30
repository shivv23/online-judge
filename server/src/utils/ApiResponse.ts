import { Response } from 'express';

export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated(
  res: Response,
  data: unknown[],
  page: number,
  limit: number,
  total: number,
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function sendError(res: Response, statusCode: number, message: string, code?: string): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code: code || 'ERROR',
      message,
    },
  });
}
