import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../integrations/supabase';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, { code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    sendError(res, { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }, 401);
    return;
  }

  (req as AuthenticatedRequest).user = user;
  next();
};
