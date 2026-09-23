import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

export const avatarUploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum 2 MB allowed.', 413, 'FILE_TOO_LARGE'));
    }
    if (err) return next(err);
    next();
  });
};
