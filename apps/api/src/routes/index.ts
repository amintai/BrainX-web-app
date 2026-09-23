import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../integrations/supabase';
import { sendSuccess, sendError } from '../utils/response';
import usersRoutes from './users.routes';

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

// Add domain routes below as features are built:
// router.use('/posts', postsRoutes);

export default router;
