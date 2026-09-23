import { supabaseAdmin } from '../integrations/supabase';
import { AppError } from '../middleware/error.middleware';
import type { Profile } from '@brainx/shared';

export const completeOnboarding = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('Failed to update onboarding status', 500, 'UPDATE_FAILED');
  }

  return data as Profile;
};
