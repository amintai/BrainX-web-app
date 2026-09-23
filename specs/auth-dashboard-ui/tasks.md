---
feature: auth-dashboard-ui
status: approved
owner: deepti.jakhotra
created: 2026-09-23
approved-by: deepti.jakhotra
approved-date: 2026-09-23
execution-strategy: Dependency Order
---

# Tasks: Auth Dashboard UI

> `plan.md` status is `approved` (approved-by deepti.jakhotra, 2026-09-23) and the constitution check is fully ticked — confirmed before writing this file. This is frontend-only work: every task touches only `apps/web`; no backend, migration, or `apps/api` file is touched by any task below. Each task closes in a single PR and states a concrete verify step.

Task ID format: `T001`, `T002`, … — used for traceability back to `FR-NNN` requirements.
`[P]` marks tasks that can run in parallel with other `[P]` tasks at the same dependency level (no shared files, no ordering constraint between them).
`Satisfies: FR-NNN` links each task to the acceptance criterion(s) it implements. Several tasks jointly satisfy one FR when the plan splits an FR's evidence across a leaf-component task and a later composition/integration task (e.g. FR-016, FR-020, FR-022, FR-026) — this mirrors the FR-traceability table in `plan.md`.

## Execution strategy: Dependency Order

This feature has clear dependency **layers** (design tokens → shared primitives → auth extensions → shell → page verticals → router integration → validation), and within several layers the plan's own component tree shows genuinely independent work: once Foundation, Primitives, Auth extensions, and Shell exist, the **Dashboard vertical** (`features/dashboard/`) and the **Users vertical** (`features/users/`) share no files and can be built in parallel by different people (their fixtures/schemas/fetchers/hooks/components never import from one another). Within each layer, leaf tasks that touch disjoint files are marked `[P]`; composition tasks that join several leaves into one page or shell (`Sidebar.jsx`, `AppShell.jsx`, `DashboardPage.jsx`, `UserManagementPage.jsx`, `router.jsx`) are sequential join points and are not marked `[P]`.

---

## Phase A — Foundation: design tokens, fonts, assets, guard test, pure libs (no shared state — all `[P]`)

- [x] **T001 [P]:** Add the Stitch design-token subset to `apps/web/src/index.css` as a plain `@theme { … }` block: 27 color tokens (Material 3 role names, see plan's Tailwind theme table), 3 font-family tokens (`--font-sans`, `--font-display`, `--font-mono`), 11 type-scale tokens (each with its line-height/letter-spacing/weight sub-values), 9 spacing tokens (`space-xs`…`margin`), and exactly 2 radius overrides (`--radius-lg: 0.25rem`, `--radius-xl: 0.5rem`, each with a comment naming the Stitch source and noting the v4-default deviation). Add `@layer base { body { @apply bg-surface text-on-surface text-body-md antialiased; } }`. Do **not** override `rounded-full` or add scrollbar-hiding rules. Satisfies: FR-001.
      Verify: reading `index.css` confirms the exact counts (27 colors, 3 fonts, 11 text-scale entries, 9 spacing, 2 radius overrides); a throwaway element with `class="bg-primary text-on-primary font-display text-headline-lg rounded-lg"` in a test page, after `pnpm --filter web build && pnpm --filter web preview`, shows in DevTools computed style `background-color: rgb(7, 2, 53)`, `color: rgb(255, 255, 255)`, `font-family` starting with `"Plus Jakarta Sans"`, and `border-radius: 4px`.

- [x] **T002 [P]:** Add font loading to `apps/web/index.html` — `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com` (the latter with `crossorigin`), and **one** Google Fonts stylesheet link covering Inter 400/500/600, JetBrains Mono 400, Plus Jakarta Sans 600/700, and Material Symbols Outlined (`wght,FILL@100..700,0..1&display=block`). Do not include Stitch's duplicate static Material Symbols link. Satisfies: FR-001 (supports icon/font rendering for FR-002–FR-024).
      Verify: `grep -c "fonts.googleapis.com/css2" apps/web/index.html` returns `1` (exactly one stylesheet link); the link's `family=` query string contains `Material+Symbols+Outlined` exactly once; `pnpm --filter web dev` and the browser Network tab shows exactly one request each to `fonts.googleapis.com` and `fonts.gstatic.com`.

- [ ] **T003 [P]:** Commit local asset copies per ADR-11 — `apps/web/src/assets/brand/` (the 2 Stitch logo images: login "Team BrainX" mark and shell "Nexus Enterprise" mark) and `apps/web/src/assets/mock-avatars/` (≤7 Stitch headshots), each resized to ≤96px on its longest edge. Satisfies: supports FR-002, FR-024 (visual assets; no FR requires these specific files, initials fallback is permitted if any image cannot be sourced).
      Verify: `ls apps/web/src/assets/brand apps/web/src/assets/mock-avatars` shows the expected file counts (2 and ≤7); each file's dimensions are ≤96px on the longest edge; no file in `apps/web/src` contains a `lh3.googleusercontent.com` URL (`grep -r "googleusercontent" apps/web/src` returns no matches); any asset that could not be sourced is logged as a dated entry in `notes.md` and its corresponding fixture uses `avatarUrl: null` / a logo `Icon` fallback instead.
      *(Best-effort: Stitch's remote image URLs may have expired — R-10. If so, ship with the initials/icon fallback and note it in `notes.md` rather than blocking the PR.)*

- [x] **T004 [P]:** Create `apps/web/src/test/tailwindLegacyClasses.test.js` — a Vitest test that globs `src/**/*.jsx` and fails if any file contains a banned Tailwind v3-only token: `font-display-lg`, `font-headline-`, `font-body-`, `font-label-`, `font-code-`, `flex-shrink-`, `flex-grow-`, or a bare `rounded`/`rounded-sm` (not `rounded-xs`/`rounded-lg`/`rounded-xl`/`rounded-full`). Satisfies: supports FR-001 (ADR-2, R-1 — the plan's single biggest identified risk).
      Verify: adding a temporary fixture file containing `className="font-body-md"` makes `pnpm --filter web test tailwindLegacyClasses` fail, naming the offending file and token in its output; removing it (or changing it to `font-sans`) makes the test pass; running it now against the near-empty `src/` tree exits 0.
      **Care flag:** re-run this exact test (T052) after every later phase — a false negative here (a banned token the regex misses) is the risk the plan calls out as hardest to detect, since Tailwind v4 emits no CSS and no error for an unrecognized class.

- [x] **T005 [P]:** Implement `apps/web/src/lib/format.js` — pure functions `formatNumber(n)` (`Intl.NumberFormat('en-US')`), `formatPercent(fraction)`, and `formatRelativeTime(date, now = Date.now())` (`Intl.RelativeTimeFormat('en', { numeric: 'auto' })`, with an injectable `now` for deterministic tests). Satisfies: supports FR-018, FR-020.
      Verify: unit tests — `formatNumber(2845)` returns `'2,845'`; `formatRelativeTime` given a fixed `now` and a date 8 minutes earlier returns a string containing `'8 minutes ago'`; calling `formatRelativeTime(date)` with no `now` argument does not throw.

- [x] **T006 [P]:** Create `apps/web/src/test/renderWithProviders.jsx` — a test helper that wraps a component tree in a fresh `QueryClient({ defaultOptions: { queries: { retry: false } } })`, a `createMemoryRouter` built from the real route tree (or a supplied element for isolated component tests), and an `AuthContext.Provider` accepting an injectable `{ session, user, status }` value. Satisfies: supports the component/interaction tests required by every FR from T008 onward (test infrastructure, no FR of its own).
      Verify: a throwaway smoke test — `renderWithProviders(<div>ok</div>, { authStatus: 'authenticated' })` renders without throwing, and `screen.getByText('ok')` succeeds; repeating with `authStatus: 'unauthenticated'` also renders without throwing.

- [x] **T007 [P]:** Create `apps/web/src/app/routes.js` — `export const ROUTES = { login: '/login', dashboard: '/', users: '/users' }`. Satisfies: supports FR-013, FR-019, FR-022, FR-026 (single source of truth for route paths, avoids hard-coded strings in the guard, sidebar, and shortcut tiles).
      Verify: unit assertion — `ROUTES.login === '/login'`, `ROUTES.dashboard === '/'`, `ROUTES.users === '/users'`; a `grep -r "'/login'" apps/web/src/features apps/web/src/app` after later tasks shows the literal only inside `routes.js` (all other references import `ROUTES`).

## Phase B — Shared primitives (`src/components/`) — leaf components, all `[P]`

- [x] **T008 [P]:** Implement `src/components/Icon.jsx` per contract: props `name`, `size (20)`, `filled (false)`, `className`, `label?`; renders `<span class="material-symbols-outlined …">{name}</span>` with inline `fontSize` and `fontVariationSettings`; `aria-hidden="true"` by default, `role="img" aria-label={label}` when `label` is given. Depends on: T002. Satisfies: supports every FR that shows an icon (FR-002–FR-024, ADR-7).
      Verify: RTL test — `<Icon name="lock" />` renders a `span` with `aria-hidden="true"` and inline style `font-size: 20px`; `<Icon name="lock" label="Locked" />` renders `role="img" aria-label="Locked"` with no `aria-hidden` attribute; `<Icon name="lock" filled />` has `fontVariationSettings` containing `'FILL' 1`.

- [x] **T009 [P]:** Implement `src/components/Avatar.jsx` and `src/components/avatar.js` (`getInitials(name)`, `toneFor(name)`) per contract: `img` with `alt={name}`, `onError` falls back to an initials circle using one of 4 literal Stitch tone-pair classes, `size` prop (`sm` = `w-8 h-8`, `md` = `w-9 h-9`). Depends on: T001, T003. Satisfies: supports FR-012, FR-024.
      Verify: unit test — `getInitials('Marcus Vance')` returns `'MV'`; `toneFor` is deterministic (same name always returns the same one of the 4 literal tone-pair strings); RTL test — rendering `<Avatar name="Marcus Vance" src="/broken.png" />` and firing the `img`'s `onError` event replaces it with a div showing text `MV` and one of the 4 literal tone-pair class strings (no interpolated class name).

- [x] **T010 [P]:** Implement `src/components/Card.jsx` — `as` prop (`'section'` default), base classes `rounded-xl bg-surface-container-lowest p-space-lg shadow-xs`. Depends on: T001. Satisfies: supports FR-016, FR-021, FR-022.
      Verify: RTL test — default render is a `<section>` with all 4 base classes present; `<Card as="article">` renders an `<article>` element with the same classes.

- [x] **T011 [P]:** Implement `src/components/ProgressBar.jsx` — `value` (clamped 0–100), `size` (`sm`/`md`), `label`; `role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax="100" aria-label`; fill width via inline `style`, not a generated class (per the ADR-2 transcription rule for dynamic `style="width: …"`). Depends on: T001. Satisfies: supports FR-016, FR-017.
      Verify: RTL test — `<ProgressBar value={130} label="x" />` renders `aria-valuenow="100"`; `<ProgressBar value={40} label="x" />` renders `aria-valuenow="40"` and the fill element's computed inline `width` style is `40%`.

- [x] **T012 [P]:** Implement `src/components/QueryState.jsx` — `query` (a `UseQueryResult`), `skeleton`, `errorMessage`, `children(data)`; `isPending` → skeleton, `isError` → `<p role="alert">` in `text-error`, success → `children(query.data)`. Depends on: T001, T006. Satisfies: supports FR-016, FR-018, FR-020.
      Verify: RTL test with a hand-built mock `UseQueryResult` object for each of the 3 states — `isPending: true` renders the passed `skeleton` node; `isError: true` renders `role="alert"` containing `errorMessage` text; the success case renders `children(data)` with the exact `data` object passed through.

- [x] **T013 [P]:** Implement `src/components/Pagination.jsx` and `src/components/pageItems.js` (`getPageItems(page, totalPages)` — pure). Depends on: T001, T006. Satisfies: supports FR-025.
      Verify: unit tests — `getPageItems(1, 3)` returns `[1,2,3]`; `getPageItems(5, 20)` returns `[1,'…',4,5,6,'…',20]`; RTL test — `<Pagination page={1} pageSize={10} total={24} itemLabel="users" onPageChange={fn} onPageSizeChange={fn} />` shows text "Showing 1–10 of 24 users", the Prev button is `disabled`, and the page-1 button has `aria-current="page"`; with `total={0}` the summary reads "Showing 0–0 of 0 users".

## Phase C — Auth extensions (`features/auth/`) — leaf tasks `[P]`, composition sequential

- [x] **T014 [P]:** Implement `features/auth/identity.js` — pure `deriveIdentity(user)` per ADR-9 (splits the email local part on `[._+-]`, title-cases each word, `fullName`/`firstName`/`initials`; `roleLabel` from `app_metadata.role`, defaulting to `'Member'`; safe fallback `{ fullName: 'there', firstName: 'there', initials: '?', roleLabel: 'Member' }` when `user`/`email` is missing). Satisfies: supports FR-012, FR-015.
      Verify: unit tests — `deriveIdentity({ email: 'deepti.jakhotra@tntra.io' })` returns `{ fullName: 'Deepti Jakhotra', firstName: 'Deepti', initials: 'DJ', roleLabel: 'Member' }`; a user with `app_metadata: { role: 'admin' }` returns `roleLabel: 'Admin'`; `deriveIdentity(null)` returns the `'there'`/`'?'` fallback; a user with `user_metadata.role` set (not `app_metadata`) still returns `roleLabel: 'Member'` (confirms role is never read from the user-editable field, per ADR-9 constitution line).

- [x] **T015 [P]:** Implement `features/auth/useSignOut.js` per ADR-10 — `signOut()` calls `supabase.auth.signOut()`, falls back to `supabase.auth.signOut({ scope: 'local' })` on error, then `queryClient.clear()`; exposes `isSigningOut`. Satisfies: FR-011 (hook half).
      Verify: unit test with `supabase.auth.signOut` mocked to reject once then the fallback mocked to resolve — `signOut()` calls the fallback with `{ scope: 'local' }` and `queryClient.clear` is called exactly once after either path settles; `isSigningOut` is `true` synchronously during the call and `false` after it resolves.

- [x] **T016 [P]:** Implement `features/auth/RedirectIfAuthenticated.jsx` per ADR-12 — pathless layout route: `status === 'loading'` → `null`; `status === 'authenticated'` → `<Navigate to={ROUTES.dashboard} replace />`; otherwise → `<Outlet />`. No side effects, no imperative navigation. Depends on: T007. Satisfies: FR-026 (guard component half).
      Verify: RTL test via `renderWithProviders` with each of the 3 `status` values — `'authenticated'` results in the router location becoming `/` (the `Navigate` fired); `'unauthenticated'` renders the `Outlet`'s child; `'loading'` renders nothing (container is empty). Confirm the condition table is the byte-for-byte inverse of `RequireAuth.jsx`'s (read both files side by side) — this is the component R-16/R-17 care flag.
      **Care flag:** this and T050/T051 are the highest-risk tasks in the plan besides the Tailwind transcription — a wrong condition here creates a redirect loop.

- [x] **T017 [P]:** Implement `features/auth/components/LoginBackdrop.jsx` (two blurred gradient decoration elements) and `features/auth/components/LoginBrandHeader.jsx` (circular logo via true `rounded-full`, "Team BrainX" label, badge pill, "Welcome back" heading, subtext). Depends on: T001, T003, T008. Satisfies: FR-002.
      Verify: RTL test — the centered card, two backdrop decoration elements, a circular (`rounded-full`) logo image, "Team BrainX", the badge pill, the heading "Welcome back", and the subtext "Sign in to access your hackathon workspace & projects" are all present in the rendered output.

- [x] **T018 [P]:** Implement `features/auth/components/AuthTextField.jsx` — Formik `useField(name)`; leading `Icon`, input with `aria-invalid`/`aria-describedby` when touched+invalid, trailing slot, error `<p id="{name}-error" class="text-body-sm text-error">` sourced from Formik `meta.error`. Depends on: T008. Satisfies: FR-003 (field rendering half), FR-004 (field rendering half).
      Verify: RTL test inside a minimal `<Formik>` wrapper — an invalid, touched field renders the error text from the (unchanged) `loginSchema` message inside `<p id="email-error">`, and the input has `aria-invalid="true"` and `aria-describedby="email-error"`; a valid field renders no error paragraph.

- [x] **T019 [P]:** Implement `features/auth/components/SsoButtons.jsx` (divider + "Google SSO"/"Microsoft" buttons, `type="button"`, no `onClick`, inline brand SVGs), `features/auth/components/PortalStatusStrip.jsx` (static "BrainX Cloud Portal · Hackathon ready"), and `features/auth/components/LoginFooter.jsx` (3 links — "Terms of Service", "Privacy Policy", "Enterprise Support" — separated by bullets, plus the "Encrypted via TLS 1.3 & SOC2 Type II Certified" line). Depends on: T001, T008. Satisfies: FR-006, FR-007.
      Verify: RTL test — clicking each SSO button (`userEvent.click`) fires no network request and no navigation (assert no mocked `fetch`/router-location change); the footer shows exactly 3 links in order with bullet separators and the TLS/SOC2 text line beneath them.

- [x] **T020:** Implement `features/auth/useIdentity.js` — wraps `useAuth()` and a memoised call to `deriveIdentity`. Depends on: T014. Satisfies: supports FR-012, FR-015.
      Verify: RTL test via `renderWithProviders` with a fake authenticated user (`email: 'deepti.jakhotra@tntra.io'`) — a probe component calling `useIdentity()` renders `fullName: 'Deepti Jakhotra'`; re-rendering the probe with the same user reference does not produce a new object (asserted via a `useMemo`-dependent render-count spy or `Object.is` check across renders).

- [x] **T021:** Restyle `features/auth/LoginPage.jsx` — keep `initialValues`, `validate`, and `onSubmit` **byte-for-byte** unchanged; add local `useState` for `showPassword` and `remember` (kept out of Formik); compose `LoginBackdrop`, `LoginBrandHeader`, the email/password `AuthTextField`s (password field's trailing slot is the visibility toggle button, swapping `visibility`/`visibility_off` and `type="password"`/`"text"`), the remember checkbox, the submit button ("Enter BrainX Workspace" + trailing `arrow_forward`, `disabled`/`aria-busy="true"` while `isSubmitting`), `SsoButtons`, `PortalStatusStrip`, and `LoginFooter`. Depends on: T017, T018, T019. Satisfies: FR-003 (toggle/validation preserved), FR-004, FR-005.
      Verify: RTL test — submitting with a mocked `supabase.auth.signInWithPassword` and valid credentials asserts it was called with **exactly** `{ email, password }` (no `remember` key), even when the checkbox is checked — this is the exact-argument test protecting FR-005/R-14; clicking the password toggle switches the input's `type` between `password`/`text` and the icon between `visibility`/`visibility_off`; submitting an invalid email still shows the unchanged `loginSchema` Zod error message; while a submission is in flight the submit button is `disabled` with `aria-busy="true"`.

## Phase D — Shell (`features/shell/`)

- [x] **T022 [P]:** Create `features/shell/navigation.js` — `PRIMARY_NAV` (`dashboard` with `end: true`, `users`, `analytics`, `settings`, each `{ key, label, icon, to?, end? }`) and `FOOTER_NAV` (`support`, `logout`). Satisfies: FR-008 (config half).
      Verify: unit assertion — `PRIMARY_NAV.map(i => i.key)` equals `['dashboard','users','analytics','settings']` in that order; `PRIMARY_NAV.find(i => i.key === 'dashboard').end === true`; `FOOTER_NAV.map(i => i.key)` equals `['support','logout']`.

- [x] **T023 [P]:** Implement `features/shell/SidebarNavItem.jsx` per contract — with `to`, renders `NavLink` (active className `bg-secondary text-on-secondary`, idle `text-primary-fixed-dim hover:bg-primary-container hover:text-on-primary`); with `onSelect`, renders `<button type="button">`; with neither, renders `<button type="button" aria-disabled="true">` with no handler. Depends on: T008. Satisfies: FR-009, FR-010.
      Verify: RTL test — at a memory route matching `to="/"` with `end`, the rendered link has `aria-current="page"`; at `/users`, that same Dashboard item has no `aria-current`; a `with onSelect` item's click calls the handler; a bare item's click produces no navigation, no handler call, and no thrown error, and it carries `aria-disabled="true"`.

- [x] **T024 [P]:** Implement `features/shell/HeaderIdentity.jsx` — `useIdentity()` → `Avatar(name=fullName, src=null, size='sm')`, `fullName` (label-md), `roleLabel` (label-sm), trailing `expand_more` `Icon`; rendered as a non-interactive `div` (no button, no menu). Depends on: T020, T009. Satisfies: FR-012 (identity block half).
      Verify: RTL test via `renderWithProviders` with a fake authenticated user (`email: 'deepti.jakhotra@tntra.io'`) — renders "Deepti Jakhotra", a role label defaulting to "Member", an `Avatar`, and an `expand_more` icon; clicking the container opens no menu and calls no handler (no `role="button"`, no `aria-haspopup`).

- [x] **T025:** Implement `features/shell/Sidebar.jsx` — brand block (logo + `BRAND_LABEL` = "Nexus Enterprise" per OI-2), `<nav aria-label="Primary">` rendering `PRIMARY_NAV` via `SidebarNavItem`, and the pinned footer group rendering `FOOTER_NAV` (Support inert, Logout wired to `useSignOut`). Depends on: T022, T023, T015, T009. Satisfies: FR-008, FR-011.
      Verify: RTL test via `renderWithProviders` — exactly 4 primary nav items render in order, followed by Support and Logout in a visually/structurally separate footer group (`aria-label` or landmark distinguishing it from the primary `nav`); clicking Logout calls the mocked `supabase.auth.signOut` exactly once and the button is `disabled` while `isSigningOut` is `true`.

- [x] **T026:** Implement `features/shell/TopHeader.jsx` — decorative search input (`aria-label="Search"`, placeholder "Search operations, users, metrics...", no handlers), notification bell (`<button type="button" aria-label="Notifications">` with a static `bg-error` unread dot, no handler), then `HeaderIdentity`. Depends on: T008, T024. Satisfies: FR-012.
      Verify: RTL test — typing into the search input and clicking the bell each produce no network call and no query invalidation (asserted by spying on the test `QueryClient`'s `invalidateQueries`/`fetchQuery` — zero calls) and no opened menu.

- [x] **T027:** Implement `features/shell/AppShell.jsx` — `<div class="min-h-screen bg-surface"><Sidebar/><div class="pl-64"><TopHeader/><main class="relative pt-16 bg-surface w-full min-h-screen px-gutter-lg py-gutter"><Outlet/></main></div></div>`, no auth-guard logic of its own (ADR-4). Depends on: T025, T026. Satisfies: FR-008, FR-012, FR-013 (shell composition half — routing wiring is T050).
      Verify: RTL test via `renderWithProviders` at an authenticated status, rendering `<AppShell>` with a stub `Outlet` child — the sidebar, header, and child content all render together inside the documented class structure; `AppShell`'s source contains no `useAuth`/`status` check and no `<Navigate>` (confirms ADR-4's "no guard logic in the shell" by inspection).

## Phase E — Dashboard vertical (`features/dashboard/`) — parallel to Phase F

- [x] **T028 [P]:** Create `features/dashboard/api/dashboard.fixtures.js` (domain data only, no Tailwind classes: KPI numbers, 4 Stitch activity entries with `occurredAt` computed relative to `Date.now()` at module load, 3-role breakdown counts 285/853/1707, 4 onboarding items with the first two `completed: true`) and `features/dashboard/api/dashboard.schemas.js` (`kpisSchema`, `activityListSchema`, `roleBreakdownSchema`, `onboardingChecklistSchema` per the plan's Data model table). Satisfies: supports FR-016, FR-017, FR-018, FR-020 (fixture/schema prerequisite).
      Verify: a unit test asserts every fixture parses successfully against its corresponding schema (`schema.parse(fixture)` throws for none of the 4 datasets); `roleBreakdownSchema.parse(fixtures.roleBreakdown).roles` sums to a `total` matching 285+853+1707 = 2845.

- [x] **T029 [P]:** Implement `features/dashboard/lib/donut.js` — pure `computeDonutSegments(values, { radius = 38 } = {})` per the plan's formula (`C = 2πr`, per-segment `dashArray`/`dashOffset`, same `fraction` used for legend percentages, `total === 0` returns `[]`). Satisfies: supports FR-020.
      Verify: unit tests — with values `[285, 853, 1707]`, the computed fractions round to `10`, `30`, `60` (percent); the sum of all segment `length` values (parsed from each `dashArray`) is within 0.01 of `C` (≈238.76 at r=38); `computeDonutSegments([0,0,0])` returns `[]`.

- [x] **T030 [P]:** Create `features/dashboard/quickLinks.js` — `QUICK_LINKS` array (`users` with `to: ROUTES.users`, `security`/`apiKeys`/`permissions` with no `to`), per the plan's 4-tile spec. Depends on: T007. Satisfies: supports FR-019.
      Verify: unit assertion — `QUICK_LINKS` has exactly 4 entries; only the `key: 'users'` entry has a truthy `to` field, and it equals `ROUTES.users`.

- [x] **T031 [P]:** Implement `features/dashboard/components/WelcomeBanner.jsx` — `useIdentity().firstName` → "Welcome back, {firstName}!" + `<span aria-hidden="true"> 👋</span>`, static env badge/subtext, two inert buttons ("View Audit Log", "Invite Team Member", `type="button"`, no handler). Depends on: T020. Satisfies: FR-015.
      Verify: RTL test via `renderWithProviders` with a fake user whose email is `deepti.jakhotra@tntra.io` — renders "Welcome back, Deepti!"; both banner buttons are `type="button"` and clicking either produces no navigation and no mocked call.

- [x] **T032 [P]:** Implement `features/dashboard/components/StatCard.jsx` and `features/dashboard/components/TrendPill.jsx` — `StatCard` per contract (`label`, `value`, `valueSuffix?`, `icon`, `iconTone`, footer `children` slot); `TrendPill` (`changePct ≥ 0` → `trending_up` + emerald classes + `+x.x%`; `< 0` → `trending_down` + error-container classes). Depends on: T010, T008. Satisfies: FR-016 (card shell + trend indicator half).
      Verify: RTL test — `<TrendPill changePct={12.4} />` renders `trending_up` and text `+12.4%` with the emerald classes; `<TrendPill changePct={-3.1} />` renders `trending_down` and the error-container classes; `<StatCard label="Total Active Users" value="2,845" icon="group" iconTone="secondary">footer</StatCard>` renders the label, value, icon, and footer content together.

- [x] **T033 [P]:** Implement `features/dashboard/components/SecurityAdvisoryCard.jsx` — static heading and body copy in a `bg-primary text-on-primary` card, no hook, no data fetch. Depends on: T010. Satisfies: FR-021.
      Verify: RTL test — the rendered card has the `bg-primary text-on-primary` classes and the static advisory heading/body text; the test's mocked `QueryClient` records zero query executions triggered by this component.

- [x] **T034 [P]:** Implement `features/dashboard/components/QuickNavigation.jsx` and `features/dashboard/components/ShortcutTile.jsx` — renders `QUICK_LINKS`; a tile with `to` renders `<Link>`, otherwise `<button type="button">` with no handler. Depends on: T030, T007. Satisfies: FR-019.
      Verify: RTL test via `renderWithProviders` — clicking the "User Management" tile navigates the memory router to `ROUTES.users` (`/users`); clicking each of the other 3 tiles produces no route change and no thrown error.

- [x] **T035:** Implement `features/dashboard/api/dashboard.api.js` — `fetchDashboardKpis`, `fetchRecentActivity`, `fetchRoleBreakdown`, `fetchOnboardingChecklist`, each resolving `structuredClone(fixtures.X)` (no network I/O) and returning `schemaX.parse(result)`. Depends on: T028. Satisfies: supports FR-016, FR-017, FR-018, FR-020 (swap-point fetchers, ADR-5).
      Verify: unit test — each fetcher resolves a value that is `structuredClone`d from (not the same object reference as) the fixture, and passes its schema's `.parse` without throwing; mutating the fetcher's resolved object does not mutate the original fixture (asserted by re-calling the fetcher and comparing to the original fixture).

- [x] **T036:** Implement `features/dashboard/api/dashboard.queries.js` — `dashboardKeys` factory and `useDashboardKpis`/`useRecentActivity`/`useRoleBreakdown`/`useOnboardingChecklist` hooks (`useQuery` wired to the T035 fetchers and matching query keys). Depends on: T035. Satisfies: supports FR-016, FR-017, FR-018, FR-020 (query-hook layer, ADR-5).
      Verify: RTL test via `renderWithProviders` — a probe component calling each hook resolves (`findBy*`) to data matching the fixture shape; `dashboardKeys.kpis()` equals `['dashboard','kpis']` (and similarly for the other 3 keys).

- [x] **T037 [P]:** Implement `features/dashboard/components/KpiGrid.jsx` — `useDashboardKpis()` inside `QueryState` with 4 card-sized skeletons; explicitly composes 4 `StatCard`s (Total Active Users w/ `TrendPill`, Workspace Licenses w/ `ProgressBar`, System Health & Security w/ pinging emerald dot, Pending Access w/ amber "Requires review" tag + inert "Review →" button). Depends on: T036, T032, T012, T011. Satisfies: FR-016.
      Verify: RTL test via `renderWithProviders` — exactly 4 `StatCard`s render (via `findAllBy*`, awaiting the mocked query), each showing its documented footer element (`TrendPill` "+12.4%", `ProgressBar` + "255 allocated / 300 total", "All systems nominal" text, "Requires review" tag); before the query resolves, 4 skeleton placeholders render instead.

- [x] **T038 [P]:** Implement `features/dashboard/components/OnboardingChecklist.jsx` and `features/dashboard/components/ChecklistItem.jsx` — `useOnboardingChecklist()` → items; owns `const [overrides, setOverrides] = useState({})`; `completed = overrides[id] ?? item.completed`; renders "N of 4 done" counter, "X% completed", `ProgressBar(size='sm')`, and the 4 `ChecklistItem`s. Row `div` owns `onClick={() => onToggle(id)}`; the inner icon/text `<button aria-pressed={completed}>` has **no own handler** (its click bubbles to the row); the trailing action button (when incomplete) calls `e.stopPropagation()` so it never toggles. Depends on: T036, T011. Satisfies: FR-017.
      Verify: RTL test via `renderWithProviders` — the initial state shows "2 of 4 done" (fixture's first two items `completed: true`) and the `ProgressBar` at 50%; clicking an incomplete item's row (or its inner button, or pressing Enter/Space on the inner button) flips it to completed, updates the counter to "3 of 4 done" and the bar to 75%, and clicking a completed item reverses it back to "2 of 4 done"; clicking the trailing action button on an incomplete item does **not** toggle it (counter stays unchanged); re-rendering the component (simulating a refetch) does not reset a toggle already applied via `overrides`.

- [x] **T039 [P]:** Implement `features/dashboard/components/ActivityFeed.jsx` and `features/dashboard/components/ActivityFeedItem.jsx` — header ("Recent Organization Activity" + inert "View Full Log") and a `divide-y` list in fixture order; each item shows an actor avatar (`Avatar` for `kind: 'user'`, a `bg-primary` circle + `Icon` for `kind: 'system'`), a JSX-built description (never an HTML string), and `formatRelativeTime(occurredAt)` + category label. Depends on: T036, T009, T008, T005. Satisfies: FR-018.
      Verify: RTL test via `renderWithProviders` — the 4 fixture entries render in fixture order, each with an actor element, a description containing the actor's name in `<strong>`, a relative-time string, and a category tag; a `dangerouslySetInnerHTML` search (`grep`) across `ActivityFeedItem.jsx` returns no matches.

- [x] **T040 [P]:** Implement `features/dashboard/components/DonutChart.jsx` and `features/dashboard/components/RoleBreakdownCard.jsx` — `RoleBreakdownCard` calls `useRoleBreakdown()`, computes `total`, renders the legend (swatch/label/`formatNumber(count)`/`formatPercent`) in fixture order (Admins, Editors, Viewers) and passes roles in **reverse** fixture order to `DonutChart`; `DonutChart` renders `<svg viewBox="0 0 100 100" class="w-full h-full -rotate-90" role="img" aria-label>` (capital-B `viewBox`, per the ADR-2 transcription rule for Stitch's lowercase typo) with a background ring plus one `<circle>` per `computeDonutSegments` output. Depends on: T036, T029, T005. Satisfies: FR-020.
      Verify: RTL test via `renderWithProviders` — the legend shows 3 rows with counts 285/853/1,707 and percents 10%/30%/60%, in that order; the rendered SVG's root element has the attribute name `viewBox` (not `viewbox`) confirmed via `container.querySelector('svg').getAttribute('viewBox')` returning a non-null value; the legend percentage for each role matches the `fraction` used to compute that role's donut segment (same source value — no independent rounding path, per FR-020's "cannot disagree" requirement).

- [x] **T041:** Compose `features/dashboard/DashboardPage.jsx` — assembles `WelcomeBanner`, `KpiGrid`, `OnboardingChecklist`, `ActivityFeed`, `QuickNavigation`, `RoleBreakdownCard`, `SecurityAdvisoryCard` in the Stitch layout (composition only, no logic of its own). Depends on: T031, T037, T038, T039, T040, T034, T033. Satisfies: FR-014 (page-level replacement of `HomePage`), joint with FR-015/016/017/018/019/020/021 (section-level, already covered above).
      Verify: RTL test via `renderWithProviders` rendering `<DashboardPage>` at an authenticated status — all 7 sections render together on one page in the documented order, and awaiting all 4 dashboard queries (`findAllBy*`) resolves with no error thrown and no section stuck on its skeleton indefinitely.

## Phase F — Users vertical (`features/users/`) — parallel to Phase E

- [x] **T042 [P]:** Create `features/users/api/users.fixtures.js` (24 users: the 7 named Stitch users — Marcus Vance, Elena Rostova, Tariq Al-Mansoor, Chloe Chen, Devon Kowalski, Sofia Ortiz, Kenji Nakamura — plus 17 generated, covering every `role` and `status` value, sized for 3 pages at page size 10: 10/10/4) and `features/users/api/users.schemas.js` (`userSchema`, `userListResponseSchema`). Satisfies: supports FR-023, FR-024, FR-025 (fixture/schema prerequisite).
      Verify: a unit test asserts all 24 fixture users individually satisfy `userSchema.parse`; the fixture array's length is exactly 24; at least one user exists for each of `administrator`/`manager`/`member`/`guest` and each of `active`/`pending`/`inactive`.

- [x] **T043 [P]:** Implement `features/users/components/RoleBadge.jsx` and `features/users/components/StatusBadge.jsx` — literal class maps per the plan's contract table (role labels Administrator/Manager/Member/Guest; status active/pending/inactive each with its own badge + dot color pair). Depends on: T001. Satisfies: FR-024 (badge rendering half).
      Verify: RTL test — `<RoleBadge role="administrator" />` renders text "Administrator" with its literal class string (no interpolated `role-${x}` class name — confirmed by reading the component source, per the ADR-2 "class-literal rule"); each of the 3 `StatusBadge` values renders its own distinct badge + dot color pair, verified by asserting the 3 rendered outputs are pairwise non-identical in their class strings.

- [x] **T044 [P]:** Implement `features/users/components/UsersPageHeader.jsx` — `<nav aria-label="Breadcrumb">` "Organization / **Access Control**" (`font-mono text-code-md uppercase`), `h1` "User Management", description text. Satisfies: FR-022 (header half).
      Verify: RTL test — the breadcrumb nav, the `h1` with exact text "User Management", and the description paragraph are all present.

- [x] **T045 [P]:** Implement `features/users/components/UserSearchInput.jsx` — controlled `value`/`onChange(value)`, `aria-label="Search users"`, placeholder "Search users by name or email...". Satisfies: FR-023 (input half).
      Verify: RTL test — typing "marcus" into the input calls `onChange` with `'marcus'` on every keystroke (controlled component, no internal state divergence from the passed `value`).

- [x] **T046:** Implement `features/users/api/users.mockServer.js` — `filterUsers(users, search)` (trim + lowercase, empty query returns all, matches `name` or `email` case-insensitively) and `paginate(filtered, page, pageSize)` (`total = filtered.length`, `items = filtered.slice((page-1)*pageSize, page*pageSize)`). Depends on: T042. Satisfies: FR-023 (filter logic), FR-025 (pagination logic).
      Verify: unit tests — `filterUsers(fixtures, 'MARCUS')` returns exactly the user(s) whose name or email contains "marcus" (case-insensitive); `filterUsers(fixtures, '')` returns all 24; `filterUsers(fixtures, 'vance@')` matches on email substring; `paginate(filtered24, 3, 10)` returns `{ items: <4 items>, total: 24 }` (the partial last page); `paginate(filtered24, 1, 10)` returns exactly 10 items.

- [x] **T047:** Implement `features/users/api/users.api.js` (`fetchUsers({ search, page, pageSize })` running `paginate(filterUsers(fixtures, search), page, pageSize)` then `userListResponseSchema.parse`) and `features/users/api/users.queries.js` (`userKeys.list(params)` and `useUsers(params)` with `placeholderData: keepPreviousData`). Depends on: T046. Satisfies: supports FR-023, FR-025 (ADR-6 swap-point fetcher + hook).
      Verify: unit test — `fetchUsers({ search: '', page: 1, pageSize: 10 })` resolves an object passing `userListResponseSchema.parse`; RTL test via `renderWithProviders` — a probe calling `useUsers({ search: 'marcus', page: 1, pageSize: 10 })` resolves `items` containing only matching users, and changing `page` while keeping `search`/`pageSize` constant does not show a loading flash for previously-fetched pages (assert `isPlaceholderData` behavior — the old page's rows remain visible until the new page resolves).

- [x] **T048 [P]:** Implement `features/users/components/UserRow.jsx` and `features/users/components/UserTable.jsx` — table `thead` (User/Role/Status, Status right-aligned), zero-row empty state ("No users match your search."), each row's User cell stacking `Avatar` + name (label-lg semibold) over email (body-sm), odd rows `bg-surface/30`, every row `hover:bg-surface-container-low/70 transition-colors`. Depends on: T043, T009. Satisfies: FR-024.
      Verify: RTL test — rendering `UserTable` with a 3-user list shows 3 rows each with an avatar/name/email stack, a `RoleBadge`, and a `StatusBadge`; rendering with `users={[]}` shows the single-row empty-state message; a `userEvent.hover` on a row and checking its class list confirms the `hover:` utility class is present in the row's `className` (transcribed, not omitted, per the ADR-2 rule).

- [x] **T049:** Compose `features/users/UserManagementPage.jsx` — owns `search`/`page`/`pageSize` state; `handleSearch(v)` sets search and resets page to 1; `handlePageSize(n)` sets pageSize and resets page to 1; composes `UsersPageHeader`, `UserSearchInput`, a search-ribbon `Card`, a table `Card` containing `UserTable` + `Pagination(itemLabel='users')`; renders the "Rows per page" select and wires it to `handlePageSize` (the plan's noted UX addition beyond the literal FR-025 text). Depends on: T047, T044, T045, T048, T013. Satisfies: FR-022, FR-023, FR-025.
      Verify: RTL test via `renderWithProviders` at `/users` — typing a search term filters the visible rows to matches and resets to page 1 (asserted after first navigating to page 2, then searching); clicking a page number shows that page's 10 (or fewer, on the last page) rows and the "Showing X–Y of Z users" text updates; changing the "Rows per page" select to 25 shows up to 25 rows, resets to page 1, and the summary text reflects the new page size; Prev is disabled on page 1 and Next is disabled on the last page.

## Phase G — Router integration (single join point)

- [x] **T050:** Wire `apps/web/src/app/router.jsx` — `{ element: <RedirectIfAuthenticated/>, children: [{ path: ROUTES.login, element: <LoginPage/> }] }`, then `{ element: <RequireAuth/>, children: [{ element: <AppShell/>, children: [{ index: true, element: <DashboardPage/> }, { path: 'users', element: <UserManagementPage/> }] }] }`, then `{ path: '*', element: <NotFoundPage/> }` (outside the shell, unchanged). Delete `apps/web/src/pages/HomePage.jsx` and remove its import. Depends on: T016, T027, T041, T049, T007. Satisfies: FR-013, FR-014, FR-022 (routing half), FR-026 (wiring half).
      Verify: `test -f apps/web/src/pages/HomePage.jsx` fails (file is gone) and `grep -r "HomePage" apps/web/src` returns no matches; RTL test via `renderWithProviders` — an authenticated visit to `/` renders `AppShell` chrome + `DashboardPage`; an authenticated visit to `/users` renders `AppShell` chrome + `UserManagementPage`; an unauthenticated visit to either route renders neither `AppShell` nor the page (redirected to `/login` before the shell mounts, per ADR-4's structural guarantee); visiting an unknown path renders `NotFoundPage` with no sidebar/header present.

## Phase H — Cross-cutting validation

- [x] **T051 [P]:** Write the full FR-026 redirect test suite (integration-level, using the real `AuthProvider` with `lib/supabase.js` mocked via a fake `onAuthStateChange` emitter, per the plan's test strategy). Covers: (1) an already-authenticated visitor landing directly on `/login` is redirected to `/` without the login form ever appearing; (2) submitting valid credentials at `/login`, then firing the fake `SIGNED_IN` event, results in the dashboard rendering, `LoginPage` never having called `navigate()`, and the history entry being replaced (Back does not return to `/login`); (3) a failed sign-in (`error` returned, no auth event fired) leaves the login form rendered with the existing `serverError` message; (4) a no-redirect-loop test toggling the shared auth `status` between `'authenticated'` and `'unauthenticated'` repeatedly and asserting the route settles on exactly one of `/` or `/login` after each toggle, never oscillating. Depends on: T050. Satisfies: FR-026 (full, R-16/R-17 closeout).
      Verify: `pnpm --filter web test` shows all 4 scenarios above passing as named test cases; the no-loop test specifically asserts the router's location changes at most once per `status` toggle (a router-navigation-count spy does not exceed 1 per toggle).
      **Care flag:** this is the second-highest risk area per the sparring review (R-16/R-17) — do not shortcut the real-`AuthProvider`-with-fake-emitter setup for a shallow mock, since the risk is specifically about the subscription wiring, not the guard's own conditional logic (already covered by T016).

- [x] **T052 [P]:** Re-run `tailwindLegacyClasses.test.js` (T004) against the now-complete `src/` tree, and manually review every `shadow-sm`/`rounded-sm` occurrence introduced in Phases C–F against the ADR-2 rule table (these are valid v4 classes the automated guard cannot ban, per R-1's stated limitation). Depends on: T050, T004. Satisfies: supports FR-001 (ADR-2/R-1 closeout).
      Verify: `pnpm --filter web test tailwindLegacyClasses` exits 0 against the full `src/` tree; `grep -rn "shadow-sm\|rounded-sm" apps/web/src` output is manually reviewed line-by-line and each match is confirmed to be an intentional v4 class (not a missed Stitch `shadow-sm`→`shadow-xs` or `rounded-sm`→`rounded-xs` transcription), with the review outcome noted in `notes.md`.

- [ ] **T053 [P]:** Manual visual parity pass — side-by-side comparison at 1440px viewport width between the running app (`/login`, `/`, `/users`) and the three Stitch HTML/Tailwind exports, checking layout proportions, iconography, copy, and hover/active/disabled component states. Depends on: T050. Satisfies: supports the spec's "visually match" technical requirement (R-8, explicitly out of automated scope per the plan).
      Verify: a checklist (one row per screen: login, dashboard, users) is completed and logged as a dated entry in `notes.md`, noting any deliberate deviations (e.g. asset fallbacks from T003) and confirming no unintentional layout/spacing/color drift is visible at 1440px.

- [x] **T054:** Full `apps/web` validation run — `pnpm --filter web test`, `pnpm --filter web lint`, `pnpm --filter web format:check`, and a manual `pnpm --filter web build && pnpm --filter web preview` smoke pass through all 3 screens plus logout. Depends on: T051, T052, T053. Satisfies: closeout for all of FR-001…FR-026.
      Verify: `pnpm --filter web test` exits 0 and its output lists every test file created in T001–T053 as executed with no skipped/failed tests; `pnpm --filter web lint` and `pnpm --filter web format:check` both exit 0; the manual preview pass confirms login → dashboard → users → logout → back-to-login all work with no console errors.

---

## Dependencies between tasks

```
Phase A — Foundation (no shared state — all [P])
├─► T001 [P] index.css design tokens
├─► T002 [P] index.html fonts + Material Symbols
├─► T003 [P] local brand/avatar assets
├─► T004 [P] tailwindLegacyClasses.test.js (guard scaffold)
├─► T005 [P] lib/format.js
├─► T006 [P] test/renderWithProviders.jsx
└─► T007 [P] app/routes.js

Phase B — Shared primitives (leaf, [P])
T002 ──► T008 [P] Icon.jsx
T001 + T003 ──► T009 [P] Avatar.jsx + avatar.js
T001 ──► T010 [P] Card.jsx
T001 ──► T011 [P] ProgressBar.jsx
T001 + T006 ──► T012 [P] QueryState.jsx
T001 + T006 ──► T013 [P] Pagination.jsx + pageItems.js

Phase C — Auth extensions
T014 [P] identity.js (deriveIdentity) — no new deps
T015 [P] useSignOut.js — no new deps
T007 ──► T016 [P] RedirectIfAuthenticated.jsx
T001 + T003 + T008 ──► T017 [P] LoginBackdrop.jsx + LoginBrandHeader.jsx
T008 ──► T018 [P] AuthTextField.jsx
T001 + T008 ──► T019 [P] SsoButtons.jsx + PortalStatusStrip.jsx + LoginFooter.jsx
T014 ──► T020 useIdentity.js
T017 + T018 + T019 ──► T021 LoginPage restyle wiring

Phase D — Shell
T022 [P] navigation.js — no new deps
T008 ──► T023 [P] SidebarNavItem.jsx
T020 + T009 ──► T024 [P] HeaderIdentity.jsx
T022 + T023 + T015 + T009 ──► T025 Sidebar.jsx
T008 + T024 ──► T026 TopHeader.jsx
T025 + T026 ──► T027 AppShell.jsx

Phase E — Dashboard vertical (parallel to Phase F)
T028 [P] dashboard.fixtures.js + dashboard.schemas.js — no new deps
T029 [P] lib/donut.js — no new deps
T030 [P] quickLinks.js (needs T007)
T020 ──► T031 [P] WelcomeBanner.jsx
T010 + T008 ──► T032 [P] StatCard.jsx + TrendPill.jsx
T010 ──► T033 [P] SecurityAdvisoryCard.jsx
T030 + T007 ──► T034 [P] QuickNavigation.jsx + ShortcutTile.jsx
T028 ──► T035 dashboard.api.js
T035 ──► T036 dashboard.queries.js
T036 + T032 + T012 + T011 ──► T037 [P] KpiGrid.jsx
T036 + T011 ──► T038 [P] OnboardingChecklist.jsx + ChecklistItem.jsx
T036 + T009 + T008 + T005 ──► T039 [P] ActivityFeed.jsx + ActivityFeedItem.jsx
T036 + T029 + T005 ──► T040 [P] DonutChart.jsx + RoleBreakdownCard.jsx
T031 + T037 + T038 + T039 + T040 + T034 + T033 ──► T041 DashboardPage.jsx

Phase F — Users vertical (parallel to Phase E)
T042 [P] users.fixtures.js + users.schemas.js — no new deps
T001 ──► T043 [P] RoleBadge.jsx + StatusBadge.jsx
T044 [P] UsersPageHeader.jsx — no new deps
T045 [P] UserSearchInput.jsx — no new deps
T042 ──► T046 users.mockServer.js
T046 ──► T047 users.api.js + users.queries.js
T043 + T009 ──► T048 [P] UserRow.jsx + UserTable.jsx (parallel to T046/T047 chain)
T047 + T044 + T045 + T048 + T013 ──► T049 UserManagementPage.jsx

Phase G — Router integration
T016 + T027 + T041 + T049 + T007 ──► T050 router.jsx wiring + HomePage.jsx deletion

Phase H — Validation
T050 ──► T051 [P] FR-026 full redirect + no-redirect-loop test suite
T050 + T004 ──► T052 [P] legacy-class guard full run + review checklist
T050 ──► T053 [P] manual visual parity pass (1440px)
T051 + T052 + T053 ──► T054 full apps/web test/lint/format validation run
```
