import { createClient } from '@supabase/supabase-js';
import config from '../config';

// Public client — respects Row Level Security
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

// Admin client — bypasses RLS; server-side only, never expose to frontend
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
