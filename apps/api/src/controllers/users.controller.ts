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
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const result = await UsersService.listProfiles(Number(page), Number(limit));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const profile = await UsersService.getUserById(req.params.id);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const profile = await UsersService.updateUserRole(req.params.id, req.body.role);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};
