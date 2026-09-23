import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/env.js';

let client;

/**
 * Lazy singleton service-role Supabase client. Server-side only — never
 * import this from anything that could ship to the browser.
 */
export function getSupabaseAdminClient() {
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
