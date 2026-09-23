import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = (req as Request & { id?: string }).id;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ requestId, method: req.method, url: req.url, err }, 'Server error');
    }
    sendError(res, { code: err.code, message: err.message }, err.statusCode);
    return;
  }

  logger.error({ requestId, method: req.method, url: req.url, err }, 'Unhandled error');
  sendError(res, { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, 500);
};
