# Onboarding Wizard — Design Spec

**Status:** approved  
**Date:** 2026-09-23  
**Feature area:** Onboarding

---

## Goal

Show first-time users a 3-step wizard immediately after signup/login if they have never completed onboarding. The wizard collects a display name, previews two key features, then lands the user on the dashboard. Completion is tracked in a single `onboarding_completed_at` timestamp so subsequent logins skip straight to the dashboard.

## Acceptance Criteria

### Database

**FR-ONB-001** — A Supabase migration adds `onboarding_completed_at timestamptz null` to `public.profiles`. Default is `null` (not completed).

**FR-ONB-002** — Existing rows are left as `null` (they will be routed through onboarding on next login). Teams that want to skip onboarding for existing users can run `UPDATE profiles SET onboarding_completed_at = now()` in seed or a follow-up migration.

**FR-ONB-003** — `profileSchema` in `packages/shared/src/schemas/profile.ts` adds `onboarding_completed_at: z.string().datetime().nullable()`.

### Backend

**FR-ONB-004** — `PATCH /api/v1/users/me/onboarding/complete` requires a valid JWT (no role restriction — any authenticated user). It sets `onboarding_completed_at = now()` for `req.user.id` and returns the updated profile in the standard success envelope.

**FR-ONB-005** — If the update fails the endpoint returns HTTP 500 with `{ success: false, error: { code: "UPDATE_FAILED", message: "..." } }`.

**FR-ONB-006** — `endpoints.onboarding.complete` (`PATCH /api/v1/users/me/onboarding/complete`) is added to `apps/web/src/utils/endpoints.ts`.

### Frontend — Guard

**FR-ONB-007** — `useOnboardingGuard` is a hook called inside `SidebarLayout`. It fetches the current user's profile via `useApiQuery(['profile', 'me'], ...)` (same endpoint as `ProfilePage`). If `onboarding_completed_at` is `null` and the query has settled (not loading), it calls `navigate(ROUTES.onboarding, { replace: true })`.

**FR-ONB-008** — The guard does not fire while the profile query is still loading (prevents flash redirect).

**FR-ONB-009** — Once the user completes onboarding and is on the dashboard, the guard does not re-fire because `onboarding_completed_at` will be set in the query cache.

**FR-ONB-010** — `ROUTES.onboarding = '/onboarding'` is added to `routePaths.ts`. The route is added to `PrivateRouteList` with no `requiredRole` and uses `OnboardingLayout` (centered, no sidebar) instead of `SidebarLayout`.

**FR-ONB-011** — `OnboardingPage` must not be wrapped in `SidebarLayout`. It uses a dedicated `OnboardingLayout`: full-screen centered white card, no nav.

### Frontend — Wizard

**FR-ONB-012** — The wizard has exactly 3 steps, tracked by a local `step` integer (1–3):

| Step | Title                 | Content                                                                                           | Gate                                     |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1    | Set up your profile   | `full_name` text input pre-filled from `profile.full_name`; description "How should we call you?" | `full_name` must be non-empty to proceed |
| 2    | Explore the dashboard | Three icon+text tiles describing Metrics, Users, and AI (static copy)                             | None — Next or Skip both advance         |
| 3    | You're all set 🎉     | Confirmation copy + "Go to Dashboard" CTA                                                         | Clicking CTA calls the complete mutation |

**FR-ONB-013** — Step 1 PATCH `full_name` via the existing `PATCH /api/v1/users/me` before advancing to step 2 (re-uses existing `updateProfile` endpoint). If the PATCH fails, show a toast error and stay on step 1.

**FR-ONB-014** — Steps 2 and 3 show a "Skip for now" text link that calls the complete mutation immediately and navigates to the dashboard.

**FR-ONB-015** — A step progress indicator (three dots or numbered circles) is shown at the top of the card. Current step is highlighted.

**FR-ONB-016** — On "Go to Dashboard" (step 3 CTA), the wizard calls `PATCH /api/v1/users/me/onboarding/complete`, invalidates `['profile', 'me']` in TanStack Query cache, then navigates to `ROUTES.dashboard`.

**FR-ONB-017** — If the complete mutation fails, show a toast error; the user can retry or use "Skip for now".

## Files

| Action           | Path                                                              |
| ---------------- | ----------------------------------------------------------------- |
| Create migration | `supabase/migrations/<timestamp>_add_onboarding_completed_at.sql` |
| Modify           | `packages/shared/src/schemas/profile.ts`                          |
| Create           | `apps/api/src/controllers/onboarding.controller.ts`               |
| Create           | `apps/api/src/services/onboarding.service.ts`                     |
| Create           | `apps/api/src/routes/onboarding.routes.ts`                        |
| Modify           | `apps/api/src/routes/index.ts`                                    |
| Create           | `apps/web/src/pages/onboarding/OnboardingPage.tsx`                |
| Create           | `apps/web/src/layouts/OnboardingLayout.tsx`                       |
| Create           | `apps/web/src/hooks/useOnboardingGuard.ts`                        |
| Modify           | `apps/web/src/layouts/SidebarLayout.tsx`                          |
| Modify           | `apps/web/src/routes/routePaths.ts`                               |
| Modify           | `apps/web/src/routes/routeMapper.tsx`                             |
| Modify           | `apps/web/src/utils/endpoints.ts`                                 |

## Out of scope

- Email-triggered onboarding reminders
- Per-step granular persistence (resuming mid-wizard after refresh)
- Onboarding re-trigger / reset UI (teams can clear `onboarding_completed_at` directly in DB)
- Invite team step (no team/org model exists yet)
