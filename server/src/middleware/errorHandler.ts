import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/ApiResponse';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.message);
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
}
