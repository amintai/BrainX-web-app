import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import { supabase } from '../../utils/supabase';
import { ROUTES } from '../../routes/routePaths';

const forgotSchema = z.object({
  email: z.string().email('Invalid email'),
});

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: { email: '' },
    validate: (values) => {
      const result = forgotSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: async (values) => {
      setLoading(true);
      // Always show success regardless of whether email exists — prevents enumeration
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      setLoading(false);
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md text-center">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Check your inbox</h1>
        <p className="text-sm text-gray-500">
          If an account exists for that email, we sent a password reset link.
        </p>
        <Link
          to={ROUTES.login}
          className="mt-4 inline-block text-sm text-brand-600 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Reset your password</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link to={ROUTES.login} className="text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
