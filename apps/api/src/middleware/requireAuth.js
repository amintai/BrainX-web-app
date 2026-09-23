import { AppError } from '../utils/AppError.js';
import { authService as defaultAuthService } from '../services/auth.service.js';

/**
 * Factory so createApp(deps) and tests can inject a fake authService without
 * a live Supabase instance (FR-010).
 */
export function createRequireAuth(authService = defaultAuthService) {
  return async function requireAuth(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) {
        throw new AppError(401, 'UNAUTHORIZED', 'Missing or malformed Authorization header');
      }

      req.user = await authService.verifyAccessToken(token);
      next();
    } catch (err) {
      next(
        err instanceof AppError ? err : new AppError(401, 'UNAUTHORIZED', 'Authentication failed'),
      );
    }
  };
}

export const requireAuth = createRequireAuth();
