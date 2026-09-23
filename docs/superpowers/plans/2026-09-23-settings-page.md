# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/settings` page with dark/light mode toggle, change-password form, and account deletion (with email confirmation) accessible from the sidebar for all authenticated users.

**Architecture:** Dark mode uses Tailwind `darkMode: 'class'` + a `useTheme` hook that syncs to `localStorage`. Password change calls `supabase.auth.updateUser` client-side. Account deletion calls `DELETE /api/v1/users/me` (backend deletes via `supabaseAdmin.auth.admin.deleteUser`), then the frontend signs out. SettingsPage contains all three sections in a single scrollable page.

**Tech Stack:** Tailwind CSS (`darkMode: 'class'`), Formik + Zod (password form), Supabase Auth JS client (password change + sign-out), Express (delete endpoint), Vitest + Supertest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-23-settings-page-design.md`

## Global Constraints

- API response envelope: `{ success: true, data: T }` / `{ success: false, error: { code, message } }` — all endpoints
- All routes prefixed `/api/v1/`
- Auth middleware (`authenticate`) required on `DELETE /api/v1/users/me`
- `useApiMutation` for API mutations; raw `supabase.auth.*` calls for Supabase Auth client operations
- `ROUTES.settings = '/settings'` — exact string
- Nav icon for Settings: `Settings` from `lucide-react`
- `localStorage` key for theme: `'brainx-theme'`

## Review Focus

1. **Delete account with wrong email typed** — "Confirm Delete" button must remain disabled; test in Task 3.
2. **Password change where `confirmPassword !== newPassword`** — form must show inline error and not submit; test in Task 3.
3. **`DELETE /api/v1/users/me` unauthenticated** — must return 401; test in Task 2.
4. **Theme toggle with no prior localStorage value** — must default to `'light'`, not throw; test in Task 1.
5. **Dark mode class applied on initial page load** (not just after first toggle) — `useTheme` must apply the class in `useEffect` on mount so a returning user sees the correct theme immediately; test in Task 1.

---

## Task 1: Dark mode — Tailwind config + useTheme hook

**Files:**

- Modify: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/hooks/useTheme.ts`
- Modify: `apps/web/src/layouts/SidebarLayout.tsx` (add `dark:` variants)
- Modify: `apps/web/src/layouts/OnboardingLayout.tsx` (add `dark:` variant)
- Test: `apps/web/src/__tests__/useTheme.test.ts`

**Interfaces:**

- Produces:
  - `useTheme(): { theme: 'light' | 'dark'; toggleTheme: () => void }`
  - Tailwind `dark:` class active when `<html>` has class `dark`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/__tests__/useTheme.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('useTheme', () => {
  it('defaults to light when localStorage has no value', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reads saved theme from localStorage on mount', () => {
    localStorage.setItem('brainx-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles from light to dark and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('brainx-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles from dark back to light and removes dark class', () => {
    localStorage.setItem('brainx-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('brainx-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — confirm RED**

```bash
pnpm --filter web test -- --reporter=verbose --testPathPattern="useTheme"
```

Expected: all 4 tests fail (`useTheme` not found).

- [ ] **Step 3: Add `darkMode: 'class'` to Tailwind config**

In `apps/web/tailwind.config.ts`, add `darkMode: 'class'` to the config object:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create useTheme hook**

```typescript
// apps/web/src/hooks/useTheme.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'brainx-theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
};
```

- [ ] **Step 5: Add dark mode variants to SidebarLayout**

In `apps/web/src/layouts/SidebarLayout.tsx`, update the root div and main element:

- Root `<div>`: `className="flex h-screen bg-gray-100 dark:bg-gray-950"`
- `<main>`: `className="flex-1 overflow-y-auto p-6 dark:bg-gray-900 dark:text-gray-100"`

- [ ] **Step 6: Add dark mode variant to OnboardingLayout**

In `apps/web/src/layouts/OnboardingLayout.tsx`, update the root div:

- `className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"`

- [ ] **Step 7: Run tests — confirm GREEN**

```bash
pnpm --filter web test -- --reporter=verbose --testPathPattern="useTheme"
```

Expected: all 4 tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web/tailwind.config.ts \
  apps/web/src/hooks/useTheme.ts \
  apps/web/src/layouts/SidebarLayout.tsx \
  apps/web/src/layouts/OnboardingLayout.tsx \
  apps/web/src/__tests__/useTheme.test.ts
git commit -m "feat(settings): add dark mode support — Tailwind class + useTheme hook"
```

---

## Task 2: Delete account backend endpoint

**Files:**

- Modify: `apps/api/src/services/users.service.ts`
- Modify: `apps/api/src/controllers/users.controller.ts`
- Modify: `apps/api/src/routes/users.routes.ts`
- Test: `apps/api/src/__tests__/deleteAccount.test.ts`

**Interfaces:**

- Produces:
  - `DELETE /api/v1/users/me` — authenticated, returns 204 on success
  - `UsersService.deleteAccount(userId: string): Promise<void>`
  - `UsersController.deleteMe` — Express handler

- [ ] **Step 1: Write failing tests**

```typescript
// apps/api/src/__tests__/deleteAccount.test.ts
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { supabaseAdmin } from '../integrations/supabase';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@brainx.io',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

describe('DELETE /api/v1/users/me', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).delete('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 204 and deletes the account when authenticated', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValue({
      data: { user: {} as never },
      error: null,
    });

    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(204);
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith(mockUser.id);
  });

  it('returns 500 when Supabase delete fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValue({
      data: { user: {} as never },
      error: new Error('Delete failed'),
    });

    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('DELETE_FAILED');
  });
});
```

- [ ] **Step 2: Run tests — confirm RED**

```bash
pnpm --filter api test -- --reporter=verbose --testPathPattern="deleteAccount"
```

Expected: 401 test passes, the other 2 fail with 404 (route not yet defined).

- [ ] **Step 3: Add deleteAccount to users.service.ts**

At the bottom of `apps/api/src/services/users.service.ts`, add:

```typescript
export const deleteAccount = async (userId: string): Promise<void> => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new AppError('Failed to delete account', 500, 'DELETE_FAILED');
};
```

- [ ] **Step 4: Add deleteMe controller to users.controller.ts**

Read `apps/api/src/controllers/users.controller.ts` first to confirm the existing import pattern, then add at the bottom:

```typescript
export const deleteMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await UsersService.deleteAccount(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 5: Add route to users.routes.ts**

In `apps/api/src/routes/users.routes.ts`, after the existing `/me` routes (before the admin section), add:

```typescript
router.delete('/me', UsersController.deleteMe);
```

- [ ] **Step 6: Run tests — confirm GREEN**

```bash
pnpm --filter api test -- --reporter=verbose --testPathPattern="deleteAccount"
```

Expected: all 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/services/users.service.ts \
  apps/api/src/controllers/users.controller.ts \
  apps/api/src/routes/users.routes.ts \
  apps/api/src/__tests__/deleteAccount.test.ts
git commit -m "feat(settings): add DELETE /users/me endpoint for account deletion"
```

---

## Task 3: SettingsPage — routing, all three sections, tests

**Files:**

- Modify: `apps/web/src/routes/routePaths.ts`
- Modify: `apps/web/src/routes/routeMapper.tsx`
- Modify: `apps/web/src/layouts/SidebarLayout.tsx`
- Create: `apps/web/src/pages/settings/SettingsPage.tsx`
- Test: `apps/web/src/__tests__/settingsPage.test.tsx`

**Interfaces:**

- Consumes:
  - `useTheme()` from `hooks/useTheme` (Task 1)
  - `DELETE /api/v1/users/me` → `endpoints.users.deleteMe` (Task 2)
  - `supabase.auth.updateUser({ password })` — Supabase client
  - `supabase.auth.signOut()` — Supabase client
  - `ROUTES.settings` = `'/settings'`
- Produces:
  - `SettingsPage` default export

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/__tests__/settingsPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import SettingsPage from '../pages/settings/SettingsPage';

const { mockDel, mockShowToastSuccess, mockShowToastError, mockUpdateUser, mockSignOut } =
  vi.hoisted(() => ({
    mockDel: vi.fn().mockResolvedValue({ data: { success: true } }),
    mockShowToastSuccess: vi.fn(),
    mockShowToastError: vi.fn(),
    mockUpdateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    mockSignOut: vi.fn().mockResolvedValue({ error: null }),
  }));

vi.mock('../utils/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: mockDel,
  },
}));

vi.mock('../utils/common', () => ({
  showToastSuccess: mockShowToastSuccess,
  showToastError: mockShowToastError,
}));

vi.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  },
}));

vi.mock('../hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: vi.fn(),
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

const authedUser = {
  id: 'u1',
  email: 'test@example.com',
  app_metadata: { role: 'member' },
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function wrap(ui: React.ReactNode) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: authedUser as never, status: 'authenticated' as never } },
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mockDel.mockResolvedValue({ data: { success: true } });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('renders Appearance, Password, and Danger Zone sections', () => {
    wrap(<SettingsPage />);
    expect(screen.getByText(/appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
  });

  it('shows password mismatch error without submitting', async () => {
    wrap(<SettingsPage />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument());
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls supabase.auth.updateUser on valid password change', async () => {
    wrap(<SettingsPage />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' }),
    );
  });

  it('keeps Delete Account confirm button disabled until email matches', () => {
    wrap(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    expect(confirmBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/type your email/i), {
      target: { value: 'wrong@example.com' },
    });
    expect(confirmBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/type your email/i), {
      target: { value: 'test@example.com' },
    });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls DELETE /users/me and signOut on confirmed account deletion', async () => {
    wrap(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.change(screen.getByPlaceholderText(/type your email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    await waitFor(() => expect(mockDel).toHaveBeenCalled());
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run tests — confirm RED**

```bash
pnpm --filter web test -- --reporter=verbose --testPathPattern="settingsPage"
```

Expected: all 5 tests fail (SettingsPage does not exist).

- [ ] **Step 3: Add ROUTES.settings**

In `apps/web/src/routes/routePaths.ts`, add:

```typescript
settings: '/settings',
```

- [ ] **Step 4: Create SettingsPage**

```typescript
// apps/web/src/pages/settings/SettingsPage.tsx
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
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          Password
        </h2>
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
```

- [ ] **Step 5: Add Settings to routeMapper and sidebar**

In `apps/web/src/routes/routeMapper.tsx`, add the lazy import:

```typescript
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
```

Add to `PrivateRouteList`:

```typescript
{ path: ROUTES.settings, component: SettingsPage, pageTitle: 'Settings', group: 'ACCOUNT' },
```

In `apps/web/src/layouts/SidebarLayout.tsx`:

Add `Settings` to the lucide-react import:

```typescript
import {
  LayoutDashboard,
  User,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
```

Add to `baseNavItems` array (after Profile, before Users):

```typescript
{ path: ROUTES.settings, label: 'Settings', icon: <Settings size={18} /> },
```

- [ ] **Step 6: Run tests — confirm GREEN**

```bash
pnpm --filter web test -- --reporter=verbose --testPathPattern="settingsPage"
```

Expected: all 5 tests pass.

- [ ] **Step 7: Run full web suite**

```bash
pnpm --filter web test
```

Expected: all tests pass (22 + 4 + 5 = 31 total or similar).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/routes/routePaths.ts \
  apps/web/src/routes/routeMapper.tsx \
  apps/web/src/layouts/SidebarLayout.tsx \
  apps/web/src/pages/settings/SettingsPage.tsx \
  apps/web/src/__tests__/settingsPage.test.tsx
git commit -m "feat(settings): add SettingsPage with dark mode, password change, and account deletion"
```
