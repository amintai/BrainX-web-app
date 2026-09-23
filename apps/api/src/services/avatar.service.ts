import { supabaseAdmin } from '../integrations/supabase';
import { AppError } from '../middleware/error.middleware';
import { updateProfile } from './users.service';
import type { Profile } from '@brainx/shared';

const BUCKET = 'avatars';
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const uploadAvatar = async (
  userId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<Profile> => {
  const ext = EXT_MAP[mimetype] ?? 'jpg';
  const storagePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

  if (uploadError) {
    throw new AppError('Failed to upload avatar to storage.', 500, 'UPLOAD_FAILED');
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);

  // Update profiles table (source of truth) and auth user_metadata so
  // the frontend's refreshUser() picks up the new avatar_url without a full re-login.
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { avatar_url: publicUrl },
  });

  return updateProfile(userId, { avatar_url: publicUrl });
};
