import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as UsersService from '../services/users.service';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await UsersService.getProfileById(req.user!.id);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await UsersService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query as { page: number; limit: number };
    const result = await UsersService.listProfiles(Number(page), Number(limit));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
