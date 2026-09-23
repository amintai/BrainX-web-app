# Auth & User Management — Design Spec

**Date:** 2026-09-23  
**Feature slug:** `auth-user-management`  
**Status:** draft  
**Author:** AminTaiTntra

---

## Context

BrainX is a hackathon boilerplate. This feature delivers a complete, working authentication and user management system that any team can use immediately without writing auth code themselves. It builds on the existing Supabase integration, `profiles` table, auth middleware, and users CRUD module.

**Success criteria:**
- A new user can sign up with email/password or Google and land on the dashboard within 30 seconds of first loading the app.
- An admin can view all users and change their roles without touching the database directly.
- All auth state is persisted across browser refreshes.
- The entire auth surface is reusable across hackathon domains with zero changes.

---

## Scope

### In scope
- Email/password sign-in and sign-up
- Google OAuth sign-in and sign-up
- Forgot password → email link → reset password flow
- Own profile view and edit (full_name, avatar_url)
- Admin user list with inline role management
- Backend endpoints for admin user operations

### Out of scope
- Magic link / OTP auth (can be added per domain)
- Multi-factor authentication
- Organisation / team management
- Email template customisation in Supabase
- Avatar file upload to Supabase Storage (URL input only in this phase)
- Social providers beyond Google (GitHub, etc. — easy to add later, same pattern)

---

## Auth Flows

### 1. Email / password sign-in

**Actors:** unauthenticated user  
**Entry:** `/` (LoginPage)

1. User enters email + password, submits.
2. Frontend calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success: Redux `setUser` dispatched, redirect to `/dashboard`.
4. On error: field-level error shown (invalid credentials, unconfirmed email).

**Validation (Formik + Zod):**
- `email`: required, valid email format
- `password`: required, min 8 characters

---

### 2. Email / password sign-up

**Actors:** unauthenticated user  
**Entry:** `/signup` (SignupPage)

1. User enters full name, email, password, confirm password, submits.
2. Frontend calls `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`.
3. Supabase `on_auth_user_created` trigger creates a `profiles` row automatically.
4. If email confirmation is **disabled** (default for local/hackathon): session is returned immediately → dispatch `setUser` → redirect to `/dashboard`.
5. If email confirmation is **enabled**: show "Check your email" message, no redirect.

**Validation (Formik + Zod):**
- `full_name`: required, 1–100 chars
- `email`: required, valid email
- `password`: required, min 8 chars
- `confirmPassword`: must match `password`

---

### 3. Google OAuth

**Actors:** unauthenticated user  
**Entry:** LoginPage or SignupPage (shared `GoogleButton` component)

1. User clicks "Continue with Google".
2. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })`.
3. Browser redirects to Google, user authenticates.
4. Google redirects back to `/auth/callback` with tokens in URL fragment.
5. `CallbackPage` detects the session, dispatches `setUser`, redirects to `/dashboard`.

**Prerequisite (manual, one-time):** Google OAuth must be enabled in Supabase Dashboard → Authentication → Providers → Google. Requires Google Cloud Console credentials (Client ID + Secret).

---

### 4. Forgot password

**Actors:** unauthenticated user  
**Entry:** `/forgot-password` (ForgotPasswordPage)

1. User enters email, submits.
2. Frontend calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<origin>/auth/callback?type=recovery' })`.
3. Supabase sends a password reset email.
4. UI shows a confirmation message ("Check your inbox") regardless of whether the email exists (prevents enumeration).

**Validation:** email required, valid format.

---

### 5. Reset password

**Actors:** user arriving from password reset email link  
**Entry:** `/auth/callback?type=recovery` → redirect to `/reset-password`

1. `CallbackPage` detects `type=recovery` in the URL query string.
2. Redirects to `/reset-password` (Supabase has already established a session for the recovery flow).
3. User enters new password + confirm password, submits.
4. Frontend calls `supabase.auth.updateUser({ password })`.
5. On success: redirect to `/` (login) with a success toast.

**Validation (Formik + Zod):**
- `password`: required, min 8 chars
- `confirmPassword`: must match `password`

---

### 6. Sign-out

**Actors:** authenticated user  
**Entry:** Sidebar logout button (already wired)

1. Calls `supabase.auth.signOut()` via `useAuth().logout()`.
2. Redux `forceLogout` dispatched.
3. Redirect to `/`.

---

## Profile Management

**Actors:** authenticated user  
**Entry:** `/profile` (ProfilePage) — private route, accessible to all roles

- Displays current profile (email read-only, full_name, avatar_url editable).
- Form submits `PATCH /api/v1/users/me` (existing endpoint).
- On success: toast + Redux user state refreshed via `refreshUser()`.

**Existing backend:** `PATCH /api/v1/users/me` with `updateProfileSchema` (full_name, avatar_url).

---

## User Management (Admin)

**Actors:** admin role only  
**Entry:** `/users` (UsersPage) — private route, admin-only

### List view
- Table of all users: full_name, email, role, joined date.
- Paginated (20 per page) via `GET /api/v1/users` (existing endpoint).
- Role badge with inline role selector per row.

### Role change
- Dropdown per user row: `member` / `manager` / `admin`.
- On change: calls `PATCH /api/v1/users/:id/role` (new endpoint).
- Backend updates **both** `profiles.role` and `auth.app_metadata.role` atomically.
- `app_metadata.role` is what `authorize()` middleware reads — updating it here means the change takes effect on the user's next API call without requiring re-login.

### View user
- No separate detail page in this phase. All info visible in the table row.

---

## Backend Changes

All under `apps/api/src/`.

### New endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/users/:id` | admin | Get profile by ID |
| `PATCH` | `/api/v1/users/:id/role` | admin | Change user role |

### `services/users.service.ts` additions

```typescript
getUserById(userId: string): Promise<Profile>
updateUserRole(userId: string, role: Role): Promise<Profile>
// updateUserRole updates profiles.role AND auth.app_metadata.role via supabaseAdmin.auth.admin.updateUserById()
```

### `validators/users.schema.ts` addition

```typescript
updateRoleSchema = z.object({ role: z.enum(['admin', 'manager', 'member']) })
```

---

## Frontend Architecture

### New files

```
src/
  components/auth/
    GoogleButton.tsx          — shared OAuth button, used on Login + Signup
  pages/auth/
    SignupPage.tsx
    ForgotPasswordPage.tsx
    ResetPasswordPage.tsx
  pages/profile/
    ProfilePage.tsx
  pages/users/
    UsersPage.tsx
```

### Updated files

```
src/
  pages/auth/LoginPage.tsx    — add GoogleButton, link to /signup and /forgot-password
  pages/auth/CallbackPage.tsx — detect type=recovery, redirect to /reset-password
  routes/routePaths.ts        — add: signup, forgotPassword, resetPassword, profile, users
  routes/routeMapper.tsx      — wire all new pages; users route = admin-only
  layouts/SidebarLayout.tsx   — add Profile nav item; Users nav item (admin-only, hidden for others)
```

### Role-based sidebar

The sidebar shows navigation items based on the authenticated user's `app_metadata.role`:
- All roles: Dashboard, Profile
- Admin only: Users

Role is read from `useAppSelector(state => state.auth.user?.app_metadata?.role)`.

---

## State & Data Flow

```
User action → Supabase Auth SDK
                  ↓
           onAuthStateChange fires
                  ↓
           Redux: setUser(session.user)
                  ↓
           Component re-renders via useAppSelector
```

Server state (profile data, user list) flows through **TanStack Query** (`useApiQuery`, `useApiMutation`). Auth session state stays in **Redux** — the two stores do not overlap.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Invalid credentials | Inline error under form: "Invalid email or password" |
| Email already registered | Inline: "An account with this email already exists" |
| Network error on OAuth | Toast: "Could not connect to authentication service" |
| Expired reset link | Supabase returns error; show: "This link has expired — request a new one" |
| Role change fails | Toast error; dropdown reverts to previous value |
| Unauthenticated access to private route | Redirect to `/?redirect=<returnPath>` |
| Non-admin access to `/users` | Redirect to `/unauthorized` |

---

## Acceptance Criteria

- **FR-AUTH-001:** A user can register with email, password, and full name. On success they land on `/dashboard` and a `profiles` row exists for them.
- **FR-AUTH-002:** A registered user can sign in with email and password and land on `/dashboard`.
- **FR-AUTH-003:** A user can sign in or sign up with Google. On return to `/auth/callback` they land on `/dashboard`.
- **FR-AUTH-004:** A user who requests a password reset receives an email. Clicking the link opens `/reset-password` and they can set a new password.
- **FR-AUTH-005:** A signed-in user can update their `full_name` and `avatar_url` on `/profile`.
- **FR-AUTH-006:** An admin can view all users at `/users` with their role, email, and join date.
- **FR-AUTH-007:** An admin can change a user's role via the `/users` table. The change takes effect on the target user's next API request without re-login.
- **FR-AUTH-008:** A non-admin user who navigates to `/users` is redirected to `/unauthorized`.
- **FR-AUTH-009:** All private routes redirect unauthenticated users to `/?redirect=<path>` and restore the original destination after login.
- **FR-AUTH-010:** The sidebar shows the Users link only to admin users.

---

## Technical Decisions

- **No custom JWT:** Supabase manages all token issuance, refresh, and revocation. The backend only calls `supabaseAdmin.auth.getUser(token)` — zero JWT logic to maintain.
- **Role in `app_metadata`:** Roles live in `app_metadata` (server-writable only). Updating via `supabaseAdmin.auth.admin.updateUserById` ensures clients cannot forge their own role. The `profiles.role` column mirrors it for UI display without an extra auth call.
- **Formik + Zod per form:** Zod validates schema; Formik manages field state and submission. Error messages come from Zod, not from strings scattered in JSX.
- **No email confirmation by default:** Supabase project defaults to off. Teams can enable it in the dashboard when they need it — no code change required.
