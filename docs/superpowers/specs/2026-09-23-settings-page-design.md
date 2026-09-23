# Settings Page — Design Spec

**Status:** approved
**Date:** 2026-09-23
**Feature area:** Settings

---

## Goal

Add a `/settings` route accessible from the sidebar. The page has three sections: Appearance (dark/light mode), Password (change password), and Danger Zone (delete account).

## Acceptance Criteria

### Routing & Navigation

**FR-SET-001** — `ROUTES.settings = '/settings'` is added to `routePaths.ts`.

**FR-SET-002** — A "Settings" nav item with a `Settings` icon (lucide-react) appears in the sidebar for all authenticated users, below "Profile".

**FR-SET-003** — `/settings` is a private route rendered inside `SidebarLayout`.

### Appearance Section

**FR-SET-004** — Tailwind config has `darkMode: 'class'`.

**FR-SET-005** — A `useTheme` hook at `apps/web/src/hooks/useTheme.ts` exposes `{ theme: 'light' | 'dark', toggleTheme: () => void }`. On mount it reads `localStorage.getItem('brainx-theme')`; defaults to `'light'` if absent. On every change it writes the new value to `localStorage` and toggles the `dark` class on `document.documentElement`.

**FR-SET-006** — The Appearance section renders a card with a label "Theme" and a toggle button that switches between Sun (light) and Moon (dark) icons. Clicking it calls `toggleTheme()`.

**FR-SET-007** — `SidebarLayout` and `OnboardingLayout` have `dark:` background/text variants so the toggle has a visible effect on the shell.

### Password Section

**FR-SET-008** — The Password section renders a form with fields `newPassword` (min 8 chars) and `confirmPassword`. Both are `type="password"`.

**FR-SET-009** — Client-side validation (Zod via Formik) ensures `newPassword.length >= 8` and `confirmPassword === newPassword`. Errors display inline.

**FR-SET-010** — On submit, the page calls `supabase.auth.updateUser({ password: newPassword })` (the frontend Supabase client at `src/utils/supabase.ts`). On success a toast fires and the form resets. On error a toast error fires.

**FR-SET-011** — No backend endpoint is needed for password change; Supabase Auth handles it natively.

### Danger Zone Section

**FR-SET-012** — The Danger Zone section renders a red-bordered card with a "Delete Account" button.

**FR-SET-013** — Clicking "Delete Account" opens a confirmation modal. The modal has a text input. The "Confirm Delete" button is disabled until the typed value exactly matches the authenticated user's email.

**FR-SET-014** — On confirm, the frontend calls `DELETE /api/v1/users/me`. On HTTP 204, the page calls `supabase.auth.signOut()` then navigates to `ROUTES.login`.

**FR-SET-015** — `DELETE /api/v1/users/me` is an authenticated endpoint (auth middleware). It calls `supabaseAdmin.auth.admin.deleteUser(req.user.id)`. Returns HTTP 204 with no body on success.

**FR-SET-016** — If the Supabase delete call fails, the endpoint returns HTTP 500 with `{ success: false, error: { code: "DELETE_FAILED" } }`.

**FR-SET-017** — An unauthenticated request to `DELETE /api/v1/users/me` returns HTTP 401.

**FR-SET-018** — `endpoints.users.deleteMe` = `/api/v1/users/me` is registered in `endpoints.ts`. The frontend calls it with `client.delete(endpoints.users.deleteMe)`.

## Out of Scope

- Email change (requires re-verification flow)
- Per-section notification preferences
- Profile picture management (covered by the avatar upload spec)
