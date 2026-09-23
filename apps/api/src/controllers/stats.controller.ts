import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as StatsService from '../services/stats.service';

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await StatsService.getStats();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
};
