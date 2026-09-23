import { supabaseAdmin } from '../integrations/supabase';
import { Profile, UpdateProfileDto } from '@brainx/shared';
import { buildPaginatedResponse, toOffset } from '../utils/pagination';
import { AppError } from '../middleware/error.middleware';

export const getProfileById = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) throw new AppError('Profile not found', 404, 'NOT_FOUND');
  return data as Profile;
};

export const updateProfile = async (userId: string, dto: UpdateProfileDto): Promise<Profile> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ ...dto, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to update profile', 500, 'UPDATE_FAILED');
  return data as Profile;
};

export const listProfiles = async (page: number, limit: number) => {
  const offset = toOffset({ page, limit });

  const { data, count, error } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch profiles', 500, 'FETCH_FAILED');
  return buildPaginatedResponse(data ?? [], count ?? 0, { page, limit });
};
