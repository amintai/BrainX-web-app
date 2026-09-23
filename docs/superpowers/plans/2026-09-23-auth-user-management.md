# Auth & User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete auth and user management system — email/password, Google OAuth, password reset, profile editing, and admin role management — on top of the existing Supabase + Express + React boilerplate.

**Architecture:** Supabase Auth SDK handles all token issuance on the frontend; the backend only calls `supabaseAdmin.auth.getUser(token)` to verify JWTs. Role enforcement uses `app_metadata.role` (server-writable only). Two new backend admin endpoints (`GET /api/v1/users/:id`, `PATCH /api/v1/users/:id/role`) extend the existing users module. Five new frontend pages (Signup, ForgotPassword, ResetPassword, Profile, Users) follow the existing Formik+Zod+Tailwind pattern.

**Tech Stack:** TypeScript, Express, Zod, `supabaseAdmin.auth.admin`, React, Formik, TanStack Query, Tailwind CSS, Lucide icons, react-hot-toast.

**Spec:** `docs/superpowers/specs/2026-09-23-auth-user-management-design.md`

## Global Constraints

- All Supabase DB access via `supabaseAdmin` JS client — no raw SQL string interpolation
- API success shape: `{ success: true, data: {} }` — use `sendSuccess(res, data)`
- API error shape: `{ success: false, error: { code, message } }` — use `AppError` + `errorHandler`
- All new Express routes prefixed `/api/v1/` via the existing `src/routes/index.ts` router
- All AI output (none in this feature) would need Zod validation — N/A here
- Frontend: no secrets in `VITE_` env vars; anon key only
- Formik validate callback maps Zod errors to `{ [field]: message }` — exact pattern from `LoginPage.tsx`
- Sidebar role check reads `user?.app_metadata?.role` from Redux `state.auth.user`
- `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_MEMBER` always imported from `@brainx/shared`

## Review Focus

- **Expired password-reset link:** Supabase returns an error when the link is one-time-used or expired; `ResetPasswordPage` must call `supabase.auth.updateUser({ password })` which will fail — show "This link has expired — request a new one" and redirect to `/forgot-password`.
- **Google OAuth with existing email-auth account:** If a user signs up with email/password first, then clicks "Continue with Google" with the same email, Supabase merges accounts by default — verify the callback navigates to dashboard, not an error page.
- **Role-change race condition:** If an admin changes their own role away from `admin`, the next page load should redirect them away from `/users` — `authorize(['admin'])` on the backend will reject the next request.
- **Unauthenticated access to `/reset-password`:** A user who visits `/reset-password` without coming from the reset email has no Supabase recovery session; `supabase.auth.updateUser()` returns an error — show inline error, not a crash.
- **Email-already-registered on signup:** `supabase.auth.signUp()` returns `user` with `identities: []` (not an error) when email confirmation is off and the email already exists — detect `identities.length === 0` and show "An account with this email already exists".

---

### Task 1: Backend admin endpoints

**Files:**
- Modify: `apps/api/src/services/users.service.ts`
- Modify: `apps/api/src/validators/users.schema.ts`
- Modify: `apps/api/src/controllers/users.controller.ts`
- Modify: `apps/api/src/routes/users.routes.ts`
- Modify: `apps/api/src/__tests__/users.test.ts`

**Interfaces:**
- Produces: `GET /api/v1/users/:id` (admin-only) → `{ success: true, data: Profile }`
- Produces: `PATCH /api/v1/users/:id/role` (admin-only) → `{ success: true, data: Profile }`
- Body schema: `{ role: 'admin' | 'manager' | 'member' }`

- [ ] **Step 1: Write failing tests for the two new endpoints**

In `apps/api/src/__tests__/users.test.ts`, add after the existing tests:

```typescript
// Add at the top of the file alongside existing mock setup — supabase mock already exists.
// For admin.updateUserById we need to extend the existing supabaseAdmin mock.
// In the vi.mock('@supabase/supabase-js') block (or wherever supabaseAdmin is mocked),
// ensure auth.admin.updateUserById is available. If the mock is in setup.ts, add there.
// Existing setup.ts mocks supabaseAdmin.from(...).select/update/single chain.
// Add mock for supabaseAdmin.auth.admin.updateUserById.

describe('GET /api/v1/users/:id', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/users/some-uuid');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    // Override getUser to return a member role user
    // (see existing users.test.ts pattern for how getUser mock works)
    const res = await request(app)
      .get('/api/v1/users/some-uuid')
      .set('Authorization', 'Bearer member-token');
    expect(res.status).toBe(403);
  });

  it('returns 200 with profile for admin', async () => {
    const res = await request(app)
      .get('/api/v1/users/test-user-id')
      .set('Authorization', 'Bearer admin-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });
});

describe('PATCH /api/v1/users/:id/role', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app)
      .patch('/api/v1/users/some-uuid/role')
      .send({ role: 'manager' });
    expect(res.status).toBe(401);
  });

  it('returns 422 with invalid role', async () => {
    const res = await request(app)
      .patch('/api/v1/users/some-uuid/role')
      .set('Authorization', 'Bearer admin-token')
      .send({ role: 'superuser' });
    expect(res.status).toBe(422);
  });

  it('returns 200 and updated profile for admin with valid role', async () => {
    const res = await request(app)
      .patch('/api/v1/users/test-user-id/role')
      .set('Authorization', 'Bearer admin-token')
      .send({ role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('manager');
  });
});
```

- [ ] **Step 2: Check how the existing test mock handles admin vs member tokens**

Open `apps/api/src/__tests__/setup.ts`. The `supabaseAdmin.auth.getUser` mock needs to distinguish tokens. Add differentiation if not present:

In `setup.ts`, find the `getUser` mock and extend it so:
- `'Bearer valid-token'` or `'Bearer admin-token'` → returns a user with `app_metadata: { role: 'admin' }`
- `'Bearer member-token'` → returns a user with `app_metadata: { role: 'member' }`

Look at the existing mock shape, then update it. The mock currently likely returns a fixed user object — wrap it in a function keyed on the token string passed to `getUser(token)`.

- [ ] **Step 3: Run the new tests to verify they fail**

```bash
cd apps/api && pnpm test --run --reporter=verbose 2>&1 | grep -A3 "GET /api/v1/users/:id\|PATCH /api/v1/users/:id/role"
```

Expected: tests fail with "Cannot GET /api/v1/users/:id" (route not found yet).

- [ ] **Step 4: Add `updateRoleSchema` to the validator**

In `apps/api/src/validators/users.schema.ts`:

```typescript
import { updateProfileSchema } from '@brainx/shared';
import { z } from 'zod';

export { updateProfileSchema };

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'member']),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
```

- [ ] **Step 5: Add `getUserById` and `updateUserRole` to the service**

In `apps/api/src/services/users.service.ts`, append after `listProfiles`:

```typescript
export const getUserById = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) throw new AppError('User not found', 404, 'NOT_FOUND');
  return data as Profile;
};

export const updateUserRole = async (userId: string, role: string): Promise<Profile> => {
  // Update app_metadata so authorize() middleware sees the change immediately
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (authError) throw new AppError('Failed to update role in auth', 500, 'UPDATE_FAILED');

  // Mirror role in profiles table for UI display without extra auth call
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to update profile role', 500, 'UPDATE_FAILED');
  return data as Profile;
};
```

- [ ] **Step 6: Add controller handlers**

In `apps/api/src/controllers/users.controller.ts`, append:

```typescript
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await UsersService.getUserById(req.params.id);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await UsersService.updateUserRole(req.params.id, req.body.role);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 7: Wire routes**

In `apps/api/src/routes/users.routes.ts`, add after the existing admin route:

```typescript
import { updateRoleSchema } from '../validators/users.schema';

// Admin only — add below the existing GET '/' route
router.get('/:id', authorize([ROLE_ADMIN]), UsersController.getUserById);
router.patch('/:id/role', authorize([ROLE_ADMIN]), validate(updateRoleSchema), UsersController.updateUserRole);
```

Full updated file:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { validate } from '../validators/validate';
import { updateProfileSchema, updateRoleSchema } from '../validators/users.schema';
import { paginationSchema } from '../validators/pagination.schema';
import * as UsersController from '../controllers/users.controller';
import { ROLE_ADMIN } from '@brainx/shared';

const router = Router();

router.use(authenticate);

router.get('/me', UsersController.getMe);
router.patch('/me', validate(updateProfileSchema), UsersController.updateMe);

// Admin only
router.get('/', authorize([ROLE_ADMIN]), validate(paginationSchema, 'query'), UsersController.listUsers);
router.get('/:id', authorize([ROLE_ADMIN]), UsersController.getUserById);
router.patch('/:id/role', authorize([ROLE_ADMIN]), validate(updateRoleSchema), UsersController.updateUserRole);

export default router;
```

- [ ] **Step 8: Run tests**

```bash
cd apps/api && pnpm test --run
```

Expected: all tests pass including the new admin endpoint tests.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/services/users.service.ts apps/api/src/validators/users.schema.ts apps/api/src/controllers/users.controller.ts apps/api/src/routes/users.routes.ts apps/api/src/__tests__/users.test.ts apps/api/src/__tests__/setup.ts
git commit -m "feat(api): add admin GET /users/:id and PATCH /users/:id/role endpoints"
```

---

### Task 2: Route constants + GoogleButton + Auth pages (Signup, ForgotPassword, Login update)

**Files:**
- Modify: `apps/web/src/routes/routePaths.ts`
- Create: `apps/web/src/components/auth/GoogleButton.tsx`
- Create: `apps/web/src/pages/auth/SignupPage.tsx`
- Create: `apps/web/src/pages/auth/ForgotPasswordPage.tsx`
- Modify: `apps/web/src/pages/auth/LoginPage.tsx`

**Interfaces:**
- Consumes: `supabase` from `../../utils/supabase`, `ROUTES` from `../../routes/routePaths`, `showToastError`/`showToastSuccess` from `../../utils/common`
- Produces: `ROUTES.signup`, `ROUTES.users`, `<GoogleButton />` (no props required), `/signup` page, `/forgot-password` page

- [ ] **Step 1: Write a smoke test for the GoogleButton**

Create `apps/web/src/__tests__/GoogleButton.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GoogleButton from '../components/auth/GoogleButton';

describe('GoogleButton', () => {
  it('renders the Google sign-in label', () => {
    render(<GoogleButton />);
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });
});
```

Run: `cd apps/web && pnpm test --run --reporter=verbose 2>&1 | grep "GoogleButton"`
Expected: FAIL — component does not exist yet.

- [ ] **Step 2: Update route constants**

Replace the contents of `apps/web/src/routes/routePaths.ts`:

```typescript
export const ROUTES = {
  login: '/',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  unauthorized: '/unauthorized',
  dashboard: '/dashboard',
  profile: '/profile',
  users: '/users',
  authCallback: '/auth/callback',
} as const;
```

- [ ] **Step 3: Create GoogleButton component**

Create `apps/web/src/components/auth/GoogleButton.tsx`:

```typescript
import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { showToastError } from '../../utils/common';

const GoogleButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // If error occurs before redirect (e.g. provider not enabled), show toast
    if (error) {
      showToastError('Could not connect to authentication service');
      setLoading(false);
    }
    // On success, browser redirects — no state cleanup needed
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
    >
      {/* Google "G" SVG icon — inlined to avoid external asset dependency */}
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  );
};

export default GoogleButton;
```

- [ ] **Step 4: Run the GoogleButton test**

```bash
cd apps/web && pnpm test --run --reporter=verbose 2>&1 | grep -A5 "GoogleButton"
```

Expected: PASS.

- [ ] **Step 5: Create SignupPage**

Create `apps/web/src/pages/auth/SignupPage.tsx`:

```typescript
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

      // When email confirmation is disabled, session is returned immediately
      if (data.session) {
        navigate(ROUTES.dashboard);
        return;
      }

      // Detect duplicate email (Supabase returns user with empty identities, no error)
      if (data.user && data.user.identities?.length === 0) {
        formik.setFieldError('email', 'An account with this email already exists');
        return;
      }

      // Email confirmation enabled — show check-your-email message
      setEmailSent(true);
    },
  });

  if (emailSent) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md text-center">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to <strong>{formik.values.email}</strong>. Click it to activate your account.
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
        {(['full_name', 'email', 'password', 'confirmPassword'] as const).map((field) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={field}>
              {field === 'full_name' ? 'Full name' : field === 'confirmPassword' ? 'Confirm password' : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              id={field}
              type={field === 'password' || field === 'confirmPassword' ? 'password' : field === 'email' ? 'email' : 'text'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...formik.getFieldProps(field)}
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className="mt-1 text-xs text-red-500">{formik.errors[field]}</p>
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
```

- [ ] **Step 6: Create ForgotPasswordPage**

Create `apps/web/src/pages/auth/ForgotPasswordPage.tsx`:

```typescript
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
      // Always show success — prevents email enumeration
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
```

- [ ] **Step 7: Update LoginPage — add GoogleButton and navigation links**

Replace `apps/web/src/pages/auth/LoginPage.tsx` with:

```typescript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { z } from 'zod';
import { supabase } from '../../utils/supabase';
import { showToastError } from '../../utils/common';
import { ROUTES } from '../../routes/routePaths';
import GoogleButton from '../../components/auth/GoogleButton';

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
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
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

      <GoogleButton />

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

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
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <Link to={ROUTES.forgotPassword} className="text-xs text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
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

      <p className="mt-4 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.signup} className="text-brand-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
```

- [ ] **Step 8: Run frontend tests**

```bash
cd apps/web && pnpm test --run
```

Expected: all tests pass including the new GoogleButton test.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/routes/routePaths.ts apps/web/src/components/auth/GoogleButton.tsx apps/web/src/pages/auth/SignupPage.tsx apps/web/src/pages/auth/ForgotPasswordPage.tsx apps/web/src/pages/auth/LoginPage.tsx apps/web/src/__tests__/GoogleButton.test.tsx
git commit -m "feat(web): add GoogleButton, SignupPage, ForgotPasswordPage; update LoginPage with links"
```

---

### Task 3: Password reset flow (ResetPasswordPage + CallbackPage update)

**Files:**
- Create: `apps/web/src/pages/auth/ResetPasswordPage.tsx`
- Modify: `apps/web/src/pages/auth/CallbackPage.tsx`

**Interfaces:**
- Consumes: `ROUTES.resetPassword`, `ROUTES.forgotPassword`, `ROUTES.login` from routePaths
- Produces: `/reset-password` page, updated `/auth/callback` that routes `type=recovery` to `/reset-password`

- [ ] **Step 1: Create ResetPasswordPage**

Create `apps/web/src/pages/auth/ResetPasswordPage.tsx`:

```typescript
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
        // Expired link: Supabase returns "Auth session missing" or similar
        if (error.message.toLowerCase().includes('session') || error.message.toLowerCase().includes('expired')) {
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
          {(['password', 'confirmPassword'] as const).map((field) => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={field}>
                {field === 'confirmPassword' ? 'Confirm password' : 'New password'}
              </label>
              <input
                id={field}
                type="password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...formik.getFieldProps(field)}
              />
              {formik.touched[field] && formik.errors[field] && (
                <p className="mt-1 text-xs text-red-500">{formik.errors[field]}</p>
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
```

- [ ] **Step 2: Update CallbackPage to handle `type=recovery`**

Replace `apps/web/src/pages/auth/CallbackPage.tsx` with:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ROUTES } from '../../routes/routePaths';
import { showToastError } from '../../utils/common';

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        showToastError('Authentication failed. Please try again.');
        navigate(ROUTES.login);
        return;
      }

      if (type === 'recovery' && session) {
        // Supabase has established a recovery session — let user set new password
        navigate(ROUTES.resetPassword);
        return;
      }

      if (session) {
        navigate(ROUTES.dashboard);
      } else {
        navigate(ROUTES.login);
      }
    });
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center text-gray-500">
      Completing sign-in…
    </div>
  );
};

export default CallbackPage;
```

- [ ] **Step 3: Run tests**

```bash
cd apps/web && pnpm test --run
```

Expected: all pass. No existing tests break (CallbackPage has no dedicated test file yet).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/auth/ResetPasswordPage.tsx apps/web/src/pages/auth/CallbackPage.tsx
git commit -m "feat(web): add ResetPasswordPage and update CallbackPage for recovery flow"
```

---

### Task 4: ProfilePage + profile route wiring

**Files:**
- Create: `apps/web/src/pages/profile/ProfilePage.tsx`
- Modify: `apps/web/src/routes/routeMapper.tsx`

**Interfaces:**
- Consumes: `PATCH /api/v1/users/me` via `client` (Axios), `useApiMutation`, `useAuth`, `ROUTES.profile`
- Produces: `/profile` private route in `PrivateRouteList`

- [ ] **Step 1: Create ProfilePage**

Create `apps/web/src/pages/profile/ProfilePage.tsx`:

```typescript
import { useFormik } from 'formik';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useApiMutation } from '../../hooks/useApiMutation';
import { client } from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import type { Profile } from '@brainx/shared';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Max 100 characters'),
  avatar_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

const ProfilePage = () => {
  const { user, refresh } = useAuth();

  const mutation = useApiMutation<Profile, { full_name: string; avatar_url?: string }>(
    (values) => client.patch(endpoints.auth.me, values).then((r) => r.data),
    { successMessage: 'Profile updated', onSuccess: () => refresh() },
  );

  const formik = useFormik({
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
      mutation.mutate({ full_name: values.full_name, avatar_url: values.avatar_url || undefined });
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
```

- [ ] **Step 2: Wire profile route in routeMapper**

Open `apps/web/src/routes/routeMapper.tsx`. Add `SignupPage`, `ForgotPasswordPage`, `ResetPasswordPage`, and `ProfilePage` to the lazy imports and route lists:

```typescript
import { lazy } from 'react';
import { ROUTES } from './routePaths';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const CallbackPage = lazy(() => import('../pages/auth/CallbackPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

export interface PublicRouteConfig {
  path: string;
  component: React.ComponentType;
}

export interface PrivateRouteConfig {
  path: string;
  component: React.ComponentType;
  pageTitle: string;
  group?: string;
}

export const PublicRouteList: PublicRouteConfig[] = [
  { path: ROUTES.login, component: LoginPage },
  { path: ROUTES.signup, component: SignupPage },
  { path: ROUTES.forgotPassword, component: ForgotPasswordPage },
  { path: ROUTES.resetPassword, component: ResetPasswordPage },
  { path: ROUTES.authCallback, component: CallbackPage },
  { path: ROUTES.unauthorized, component: UnauthorizedPage },
];

export const PrivateRouteList: PrivateRouteConfig[] = [
  { path: ROUTES.dashboard, component: DashboardPage, pageTitle: 'Dashboard', group: 'OVERVIEW' },
  { path: ROUTES.profile, component: ProfilePage, pageTitle: 'Profile', group: 'ACCOUNT' },
];

export { NotFoundPage };
```

**Note:** `ResetPasswordPage` is in `PublicRouteList` because the user arrives from an email link without a Redux-authenticated session. Supabase establishes the recovery session before `updateUser()` is called — the page itself handles the case where no session exists.

- [ ] **Step 3: Run tests**

```bash
cd apps/web && pnpm test --run
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/profile/ProfilePage.tsx apps/web/src/routes/routeMapper.tsx
git commit -m "feat(web): add ProfilePage and wire profile route"
```

---

### Task 5: UsersPage + admin route + sidebar admin nav

**Files:**
- Create: `apps/web/src/pages/users/UsersPage.tsx`
- Modify: `apps/web/src/routes/routeMapper.tsx`
- Modify: `apps/web/src/layouts/SidebarLayout.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/users?page=1&limit=20` and `PATCH /api/v1/users/:id/role` via Axios `client`
- Consumes: `useApiQuery`, `useApiMutation` hooks, `PaginatedResponse`, `Profile`, `ROLE_ADMIN`, `ROLE_LABELS` from `@brainx/shared`
- Produces: `/users` private route (admin-only in sidebar), admin-conditional nav item

- [ ] **Step 1: Check endpoints barrel for missing entries**

Open `apps/web/src/utils/endpoints.ts`. It currently has `auth.me` and `auth.logout`. Add users endpoints if missing:

```typescript
export const endpoints = {
  auth: {
    me: '/api/v1/users/me',
    logout: '/api/v1/auth/logout',
  },
  users: {
    list: '/api/v1/users',
    byId: (id: string) => `/api/v1/users/${id}`,
    role: (id: string) => `/api/v1/users/${id}/role`,
  },
} as const;
```

- [ ] **Step 2: Create UsersPage**

Create `apps/web/src/pages/users/UsersPage.tsx`:

```typescript
import { useState } from 'react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import { client } from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import type { PaginatedResponse, Profile } from '@brainx/shared';
import { ROLE_LABELS } from '@brainx/shared';

const ROLES = ['member', 'manager', 'admin'] as const;
const PAGE_SIZE = 20;

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useApiQuery<PaginatedResponse<Profile>>(
    ['users', page],
    () => client.get(`${endpoints.users.list}?page=${page}&limit=${PAGE_SIZE}`).then((r) => r.data),
  );

  const roleMutation = useApiMutation<Profile, { userId: string; role: string }>(
    ({ userId, role }) => client.patch(endpoints.users.role(userId), { role }).then((r) => r.data),
    {
      successMessage: 'Role updated',
      errorMessage: 'Failed to update role',
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    },
  );

  if (isLoading) {
    return <p className="text-gray-500">Loading users…</p>;
  }

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Users</h1>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={roleMutation.isPending}
                    onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages} · {total} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
```

- [ ] **Step 3: Wire `/users` route in routeMapper**

In `apps/web/src/routes/routeMapper.tsx`, add the lazy import and route entry (the file was already updated in Task 4; add `UsersPage` here):

```typescript
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
```

And in `PrivateRouteList`:

```typescript
{ path: ROUTES.users, component: UsersPage, pageTitle: 'Users', group: 'ADMIN' },
```

- [ ] **Step 4: Add admin-only Users nav item to SidebarLayout**

Replace `apps/web/src/layouts/SidebarLayout.tsx` with:

```typescript
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Users, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { ROUTES } from '../routes/routePaths';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector } from '../store/hooks';
import { ROLE_ADMIN } from '@brainx/shared';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { path: ROUTES.dashboard, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: ROUTES.profile, label: 'Profile', icon: <User size={18} /> },
  { path: ROUTES.users, label: 'Users', icon: <Users size={18} />, adminOnly: true },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.auth.user?.app_metadata?.role as string | undefined);

  const navItems = baseNavItems.filter((item) => !item.adminOnly || role === ROLE_ADMIN);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`flex flex-col bg-gray-900 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          {!collapsed && <span className="text-lg font-bold tracking-tight">BrainX</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {icon}
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          {!collapsed && (
            <p className="mb-2 truncate text-xs text-gray-400">{user?.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
};

export default SidebarLayout;
```

- [ ] **Step 5: Verify `ROLE_LABELS` is exported from `@brainx/shared`**

Open `packages/shared/src/constants/roles.ts`. Confirm `ROLE_LABELS` is exported:

```typescript
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};
```

If missing, add it there and re-export from `packages/shared/src/index.ts`.

- [ ] **Step 6: Run full test suite**

```bash
pnpm -r test --run
```

Expected: all tests pass across api and web.

- [ ] **Step 7: Type check**

```bash
pnpm -r tsc --noEmit
```

Fix any TypeScript errors before committing.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/users/UsersPage.tsx apps/web/src/routes/routeMapper.tsx apps/web/src/layouts/SidebarLayout.tsx apps/web/src/utils/endpoints.ts packages/shared/src/constants/roles.ts packages/shared/src/index.ts
git commit -m "feat(web): add UsersPage, admin sidebar nav, and wire all routes"
```

---

## Post-implementation checklist

- [ ] Enable Google OAuth in Supabase Dashboard → Authentication → Providers → Google (requires Google Cloud Console Client ID + Secret)
- [ ] Add real values to `apps/api/.env` and `apps/web/.env` (copy from `.env.example` files, fill in Supabase anon key and service role key)
- [ ] Verify `supabase/config.toml` `site_url` and `additional_redirect_urls` match the deployed frontend URL when deploying to production
