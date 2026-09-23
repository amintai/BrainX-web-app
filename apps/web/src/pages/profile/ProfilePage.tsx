import { useFormik } from 'formik';
import { z } from 'zod';
import type { ApiSuccess, Profile } from '@brainx/shared';
import { useAuth } from '../../hooks/useAuth';
import { useApiMutation } from '../../hooks/useApiMutation';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Max 100 characters'),
  avatar_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

type ProfileFormValues = { full_name: string; avatar_url: string };

const ProfilePage = () => {
  const { user, refresh } = useAuth();

  const mutation = useApiMutation<Profile, ProfileFormValues>(
    (values) =>
      client
        .patch<ApiSuccess<Profile>>(endpoints.auth.me, {
          full_name: values.full_name,
          avatar_url: values.avatar_url || undefined,
        })
        .then((r) => r.data),
    { successMessage: 'Profile updated', onSuccess: () => refresh() },
  );

  const formik = useFormik<ProfileFormValues>({
    enableReinitialize: true,
    initialValues: {
      full_name: (user?.user_metadata?.full_name as string) ?? '',
      avatar_url: (user?.user_metadata?.avatar_url as string) ?? '',
    },
    validate: (values) => {
      const result = profileSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Your Profile</h1>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="avatar_url">
              Avatar URL
            </label>
            <input
              id="avatar_url"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...formik.getFieldProps('avatar_url')}
            />
            {formik.touched.avatar_url && formik.errors.avatar_url && (
              <p className="mt-1 text-xs text-red-500">{formik.errors.avatar_url}</p>
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
