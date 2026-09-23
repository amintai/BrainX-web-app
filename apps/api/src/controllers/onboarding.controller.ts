import type { Request, Response, NextFunction } from 'express';
import * as OnboardingService from '../services/onboarding.service';
import { sendSuccess } from '../utils/response';

export const completeOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const profile = await OnboardingService.completeOnboarding(req.user!.id);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};
