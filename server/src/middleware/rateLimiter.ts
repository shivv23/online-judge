import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const WINDOW_MS = 15 * 60 * 1000;

export const rateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: env.nodeEnv === 'production' ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later.' },
  },
});

export const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Submission rate limit exceeded (10/minute).' },
  },
});
