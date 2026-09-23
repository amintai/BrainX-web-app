import { Request, Response, NextFunction } from 'express';
import { Role, ROLE_MEMBER } from '@brainx/shared';
import { sendError } from '../utils/response';

export const authorize =
  (roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      sendError(res, { code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
      return;
    }

    // Role is stored in app_metadata (server-side only, cannot be forged by client)
    const userRole = (user.app_metadata?.role ?? ROLE_MEMBER) as Role;

    if (!roles.includes(userRole)) {
      sendError(res, { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' }, 403);
      return;
    }

    next();
  };
