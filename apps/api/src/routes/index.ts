import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../integrations/supabase';
import { sendSuccess, sendError } from '../utils/response';
import usersRoutes from './users.routes';
import statsRoutes from './stats.routes';

const router = Router();

// Health check — verifies server + Supabase connectivity
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) throw error;
    sendSuccess(res, { status: 'ok', db: 'connected' });
  } catch {
    sendError(res, { code: 'SERVICE_UNAVAILABLE', message: 'Database unreachable' }, 503);
  }
});

router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);

export default router;
