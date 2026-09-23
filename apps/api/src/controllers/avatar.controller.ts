import type { Request, Response, NextFunction } from 'express';
import * as AvatarService from '../services/avatar.service';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) throw new AppError('No file provided.', 400, 'NO_FILE');
    const profile = await AvatarService.uploadAvatar(
      req.user!.id,
      req.file.buffer,
      req.file.mimetype,
    );
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};
