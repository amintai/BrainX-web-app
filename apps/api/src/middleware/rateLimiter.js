import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

/**
 * Default: 15-minute window, 100 requests per IP (FR-005).
 * `overrides` lets tests inject a small `max` without touching production defaults.
 */
export function createRateLimiter({ windowMs = 900000, max = 100 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'));
    },
  });
}
