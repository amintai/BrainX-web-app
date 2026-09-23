import { useFormik } from 'formik';
import { z } from 'zod';
import type { ApiSuccess, Profile } from '@brainx/shared';
import { useAuth } from '../../hooks/useAuth';
import { useApiMutation } from '../../hooks/useApiMutation';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import AvatarUpload from '../../components/profile/AvatarUpload';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Max 100 characters'),
});

type ProfileFormValues = { full_name: string };

const getInitials = (name: string | null | undefined, email: string | undefined): string => {
  if (name?.trim()) return name.trim()[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
};

const ProfilePage = () => {
  const { user, refresh } = useAuth();

  const mutation = useApiMutation<Profile, ProfileFormValues>(
    (values) =>
      client
        .patch<ApiSuccess<Profile>>(endpoints.auth.me, { full_name: values.full_name })
        .then((r) => r.data),
    { successMessage: 'Profile updated', onSuccess: () => refresh() },
  );

  const formik = useFormik<ProfileFormValues>({
    enableReinitialize: true,
    initialValues: {
      full_name: (user?.user_metadata?.full_name as string) ?? '',
    },
    validate: (values) => {
      const result = profileSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: (values) => mutation.mutate(values),
  });

  const avatarUrl = user?.user_metadata?.avatar_url as string | null | undefined;
  const initials = getInitials(user?.user_metadata?.full_name as string, user?.email);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Your Profile</h1>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <AvatarUpload currentUrl={avatarUrl} initials={initials} />
          <div>
            <p className="text-sm font-medium text-gray-700">Profile photo</p>
            <p className="text-xs text-gray-400">JPEG, PNG or WebP · max 2 MB</p>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="full_name">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...formik.getFieldProps('full_name')}
            />
            {formik.touched.full_name && formik.errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{formik.errors.full_name}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
