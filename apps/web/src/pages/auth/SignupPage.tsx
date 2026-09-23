import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import { supabase } from '../../utils/supabase';
import { showToastError } from '../../utils/common';
import { ROUTES } from '../../routes/routePaths';
import GoogleButton from '../../components/auth/GoogleButton';

const signupSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required').max(100, 'Max 100 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { full_name: '', email: '', password: '', confirmPassword: '' },
    validate: (values) => {
      const result = signupSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: async (values) => {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.full_name } },
      });
      setLoading(false);

      if (error) {
        showToastError(error.message);
        return;
      }

      if (data.session) {
        navigate(ROUTES.dashboard);
        return;
      }

      // Supabase returns user with empty identities when email already exists and confirmation is off
      if (data.user && data.user.identities?.length === 0) {
        formik.setFieldError('email', 'An account with this email already exists');
        return;
      }

      setEmailSent(true);
    },
  });

  if (emailSent) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md text-center">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to <strong>{formik.values.email}</strong>. Click it to
          activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create your account</h1>

      <GoogleButton />

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {(
          [
            { name: 'full_name', label: 'Full name', type: 'text' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'password', label: 'Password', type: 'password' },
            { name: 'confirmPassword', label: 'Confirm password', type: 'password' },
          ] as const
        ).map(({ name, label, type }) => (
          <div key={name}>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={name}>
              {label}
            </label>
            <input
              id={name}
              type={type}
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
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignupPage;
