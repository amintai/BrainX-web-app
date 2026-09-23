import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import { supabase } from '../../utils/supabase';
import { showToastError } from '../../utils/common';
import { ROUTES } from '../../routes/routePaths';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const result = loginSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(
        result.error.errors.map((e) => [e.path[0], e.message]),
      );
    },
    onSubmit: async (values) => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      setLoading(false);
      if (error) {
        showToastError(error.message);
      } else {
        navigate(ROUTES.dashboard);
      }
    },
  });

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign in to BrainX</h1>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...formik.getFieldProps('email')}
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...formik.getFieldProps('password')}
          />
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-xs text-red-500">{formik.errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
