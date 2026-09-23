import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import { supabase } from '../../utils/supabase';
import { showToastSuccess, showToastError } from '../../utils/common';
import { ROUTES } from '../../routes/routePaths';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validate: (values) => {
      const result = resetSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: async (values) => {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: values.password });
      setLoading(false);

      if (error) {
        const isSessionError =
          error.name === 'AuthSessionMissingError' || error.status === 400 || error.status === 401;
        if (isSessionError) {
          showToastError('This link has expired — request a new one');
          navigate(ROUTES.forgotPassword);
        } else {
          showToastError(error.message);
        }
        return;
      }

      showToastSuccess('Password updated. Please sign in.');
      await supabase.auth.signOut();
      navigate(ROUTES.login);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Set new password</h1>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {(
            [
              { name: 'password', label: 'New password' },
              { name: 'confirmPassword', label: 'Confirm password' },
            ] as const
          ).map(({ name, label }) => (
            <div key={name}>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={name}>
                {label}
              </label>
              <input
                id={name}
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...formik.getFieldProps(name)}
              />
              {formik.touched[name] && formik.errors[name] && (
                <p className="mt-1 text-xs text-red-500">{formik.errors[name]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
