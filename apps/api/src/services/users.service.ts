import { supabaseAdmin } from '../integrations/supabase';
import { Profile, UpdateProfileDto } from '@brainx/shared';
import { buildPaginatedResponse, toOffset } from '../utils/pagination';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

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

export const getUserById = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) throw new AppError('User not found', 404, 'NOT_FOUND');
  return data as Profile;
};

export const deleteAccount = async (userId: string): Promise<void> => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new AppError('Failed to delete account', 500, 'DELETE_FAILED');
};

export const updateUserRole = async (userId: string, role: string): Promise<Profile> => {
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (authError) throw new AppError('Failed to update role in auth', 500, 'UPDATE_FAILED');

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    logger.error(
      { userId, role, err: error },
      'PARTIAL FAILURE: auth.app_metadata updated but profiles.role update failed — manual remediation required',
    );
    throw new AppError('Failed to update profile role', 500, 'UPDATE_FAILED');
  }
  return data as Profile;
};
