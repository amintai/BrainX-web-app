import { supabaseAdmin } from '../integrations/supabase';
import { AppError } from '../middleware/error.middleware';

export interface StatsData {
  userCount: number;
  adminCount: number;
  managerCount: number;
  memberCount: number;
}

export const getStats = async (): Promise<StatsData> => {
  const { data, error } = await supabaseAdmin.from('profiles').select('role');

  if (error) throw new AppError('Failed to fetch stats', 500, 'FETCH_FAILED');

  const rows = (data ?? []) as { role: string }[];
  return {
    userCount: rows.length,
    adminCount: rows.filter((r) => r.role === 'admin').length,
    managerCount: rows.filter((r) => r.role === 'manager').length,
    memberCount: rows.filter((r) => r.role === 'member').length,
  };
};
