import { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response =>
  res.status(statusCode).json({ success: true, data });

export const sendError = (
  res: Response,
  error: { code: string; message: string },
  statusCode = 400,
  fields?: Record<string, string>,
): Response =>
  res.status(statusCode).json({ success: false, error, ...(fields && { fields }) });
