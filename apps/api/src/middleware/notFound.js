import { AppError } from '../utils/AppError.js';

/**
 * Mounted last (before errorHandler). Any request that reached here matched
 * no route — including requests missing the required /api/v1 prefix.
 */
export function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}
