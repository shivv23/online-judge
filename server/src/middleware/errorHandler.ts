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
    sendError(res, err.statusCode, err.message, err.code);
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    sendError(res, 401, 'Invalid token', 'UNAUTHORIZED');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 401, 'Token has expired', 'TOKEN_EXPIRED');
    return;
  }

  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {}).join(', ');
    sendError(res, 409, `Duplicate value for: ${field}`, 'DUPLICATE');
    return;
  }

  if (err.name === 'ValidationError') {
    sendError(res, 400, err.message, 'VALIDATION_ERROR');
    return;
  }

  if (err.name === 'CastError' && (err as any).kind === 'ObjectId') {
    sendError(res, 400, 'Invalid ID format', 'INVALID_ID');
    return;
  }

  console.error('[error]', err);
  sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
}
