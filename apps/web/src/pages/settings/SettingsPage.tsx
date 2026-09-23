import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { showToastSuccess, showToastError } from '../../utils/common';
import { supabase } from '../../utils/supabase';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import { ROUTES } from '../../routes/routePaths';

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormValues = { newPassword: string; confirmPassword: string };

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const passwordFormik = useFormik<PasswordFormValues>({
    initialValues: { newPassword: '', confirmPassword: '' },
    validate: (values) => {
      const result = passwordSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: async (values, helpers) => {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) {
        showToastError(error.message ?? 'Failed to update password');
      } else {
        showToastSuccess('Password updated');
        helpers.resetForm();
      }
    },
  });

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await client.del(endpoints.users.deleteMe);
      await supabase.auth.signOut();
      navigate(ROUTES.login, { replace: true });
    } catch {
      showToastError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Appearance */}
      <section className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
            <span className="capitalize">{theme}</span>
          </button>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Password</h2>
        <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="newPassword"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...passwordFormik.getFieldProps('newPassword')}
            />
            {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordFormik.errors.newPassword}</p>
            )}
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...passwordFormik.getFieldProps('confirmPassword')}
            />
            {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordFormik.errors.confirmPassword}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={passwordFormik.isSubmitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {passwordFormik.isSubmitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-red-200 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-red-600">Danger Zone</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete Account
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              Delete Account
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              This action is irreversible. Type your email to confirm.
            </p>
            <input
              type="email"
              placeholder="Type your email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteEmail('');
                }}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteEmail !== user?.email || isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
