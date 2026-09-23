import { AppError } from '../utils/AppError.js';
import { getSupabaseAdminClient } from '../integrations/supabase/client.js';

/**
 * Verifies a Supabase access token server-side via auth.getUser(jwt) on the
 * service-role client (ADR-7 / OQ-001). This is authoritative and honours
 * revocation/sign-out, at the cost of one network round trip per call.
 */
export async function verifyAccessToken(token) {
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing bearer token');
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  const { id, email, role } = data.user;
  return { id, email, role };
}

export const authService = { verifyAccessToken };
