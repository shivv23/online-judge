import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const WINDOW_MS = 15 * 60 * 1000;

const noopLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

function createLimiter(opts: { windowMs: number; max: number; message: object }) {
  if (env.nodeEnv === 'test') return noopLimiter;
  return rateLimit({
    ...opts,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const rateLimiter = createLimiter({
  windowMs: WINDOW_MS,
  max: env.nodeEnv === 'production' ? 100 : 10000,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  },
});

export const authLimiter = createLimiter({
  windowMs: WINDOW_MS,
  max: 20,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later.' },
  },
});

export const submitLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Submission rate limit exceeded (10/minute).' },
  },
});
