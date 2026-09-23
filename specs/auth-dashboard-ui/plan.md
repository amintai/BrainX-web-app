---
feature: auth-dashboard-ui
status: approved   # draft -> in-review -> approved
owner: deepti.jakhotra
created: 2026-09-23
approved-by: deepti.jakhotra
approved-date: 2026-09-23
---

# Plan: Auth Dashboard UI

> Spec confirmed `status: approved` (deepti.jakhotra, 2026-09-23). All five open questions are resolved inline in `spec.md`. This plan treats those resolutions as binding: email-derived identity, Material Symbols web font, inline-SVG donut, TanStack Query with mocked `queryFn`s, and a token subset only.

## Architecture overview

### Starting state (verified by reading the code)

- `apps/web/src/index.css` contains only `@import 'tailwindcss';`. There are no theme tokens and no naming convention to follow, so this feature sets the convention (ADR-1).
- `apps/web/index.html` loads no web fonts.
- `router.jsx` has `/login`, a pathless `RequireAuth` layout route with a single `/` child (`HomePage`), and `*`.
- `LoginPage.jsx` is Formik with `initialValues={{ email: '', password: '' }}`, `validate={toFormikValidate(loginSchema)}`, and `onSubmit` → `supabase.auth.signInWithPassword(values)`. **The full `values` object is passed to Supabase**, so any new Formik field would change the submission payload. See "Login restyle constraints".
- `LoginPage` does **not** navigate after a successful sign-in. An authenticated user stays on `/login` until they navigate manually. FR-026 (added to the spec after OI-1) closes this gap with a guard route (ADR-12).
- `AuthProvider` exposes `{ session, user, status: 'loading'|'authenticated'|'unauthenticated' }`. `AuthContext` is exported, so tests can supply a fake value.
- Redux holds only `ui.sidebarOpen` (placeholder). This feature adds no Redux state (ADR-8).
- `packages/ui` is a placeholder. `apps/api` is untouched by this feature (`GET /api/v1/me` returns only `{ id, email }`).
- Tailwind is **v4.3.3** (CSS-first `@theme`) and React Router is **7.9.6** (data mode). The Stitch exports target the **Tailwind v3 CDN** with a JS config, so markup cannot be pasted verbatim (ADR-2).

### Target layout (new / changed files only)

```
apps/web/
├── index.html                                   # CHANGED: Google Fonts preconnect + text fonts + Material Symbols (ADR-7)
└── src/
    ├── index.css                                # CHANGED: @theme token subset + @layer base body defaults (ADR-1)
    ├── app/
    │   ├── router.jsx                           # CHANGED: RequireAuth > AppShell > { '/', '/users' } (ADR-4)
    │   └── routes.js                            # NEW: ROUTES = { login: '/login', dashboard: '/', users: '/users' }
    ├── assets/
    │   ├── brand/                               # NEW: local copies of the two Stitch logo images (ADR-11)
    │   └── mock-avatars/                        # NEW: ≤7 local copies of Stitch headshots used by fixtures (ADR-11)
    ├── components/                              # NEW: app-wide presentational primitives, no data/routing knowledge (ADR-3)
    │   ├── Icon.jsx                             # Material Symbols span wrapper (ADR-7)
    │   ├── Avatar.jsx                           # image with initials fallback + deterministic tone
    │   ├── avatar.js                            # getInitials(name), toneFor(name) — pure
    │   ├── Card.jsx                             # section surface: rounded-xl bg-surface-container-lowest p-space-lg shadow-xs
    │   ├── ProgressBar.jsx                      # role="progressbar", width via inline style
    │   ├── QueryState.jsx                       # pending skeleton / error message / children
    │   ├── Pagination.jsx                       # summary + rows-per-page + page buttons
    │   └── pageItems.js                         # getPageItems(page, totalPages) — pure
    ├── lib/
    │   └── format.js                            # NEW: formatNumber, formatPercent, formatRelativeTime — pure
    ├── features/
    │   ├── auth/
    │   │   ├── LoginPage.jsx                    # CHANGED: markup only — Formik config/loginSchema/onSubmit untouched
    │   │   ├── components/
    │   │   │   ├── LoginBackdrop.jsx            # two blurred gradient blobs (FR-002)
    │   │   │   ├── LoginBrandHeader.jsx         # logo, "Team BrainX", badge pill, heading, subtext (FR-002)
    │   │   │   ├── AuthTextField.jsx            # Formik useField + leading icon + trailing slot + error (FR-003/004)
    │   │   │   ├── SsoButtons.jsx               # divider + two decorative buttons, inline brand SVGs (FR-006)
    │   │   │   ├── PortalStatusStrip.jsx        # "BrainX Cloud Portal · Hackathon ready" (design parity)
    │   │   │   └── LoginFooter.jsx              # 3 links + TLS/SOC2 line (FR-007)
    │   │   ├── RedirectIfAuthenticated.jsx      # NEW: guest-only layout route, mirror of RequireAuth (FR-026, ADR-12)
    │   │   ├── identity.js                      # NEW: deriveIdentity(user) — pure (ADR-9)
    │   │   ├── useIdentity.js                   # NEW: useAuth() + memoised deriveIdentity
    │   │   └── useSignOut.js                    # NEW: signOut + queryClient.clear() (ADR-10)
    │   ├── shell/                               # NEW
    │   │   ├── AppShell.jsx                     # Sidebar + TopHeader + <main><Outlet/></main>
    │   │   ├── Sidebar.jsx
    │   │   ├── SidebarNavItem.jsx               # NavLink | action button | inert button
    │   │   ├── TopHeader.jsx                    # decorative search, bell, HeaderIdentity
    │   │   ├── HeaderIdentity.jsx               # Avatar(initials) + name + role + chevron
    │   │   └── navigation.js                    # PRIMARY_NAV / FOOTER_NAV config
    │   ├── dashboard/                           # NEW
    │   │   ├── DashboardPage.jsx                # composition only
    │   │   ├── api/
    │   │   │   ├── dashboard.fixtures.js        # domain data only (no Tailwind classes)
    │   │   │   ├── dashboard.schemas.js         # Zod response contracts
    │   │   │   ├── dashboard.api.js             # fetchers = THE swap point (ADR-5)
    │   │   │   └── dashboard.queries.js         # dashboardKeys + useDashboardKpis/useRecentActivity/useRoleBreakdown/useOnboardingChecklist
    │   │   ├── lib/donut.js                     # computeDonutSegments — pure
    │   │   ├── quickLinks.js                    # QUICK_LINKS config (navigation, not data)
    │   │   └── components/
    │   │       ├── WelcomeBanner.jsx            # FR-015
    │   │       ├── KpiGrid.jsx                  # composes 4 StatCards explicitly (FR-016)
    │   │       ├── StatCard.jsx                 # shell: label, value, icon, footer slot
    │   │       ├── TrendPill.jsx                # "+12.4%" pill
    │   │       ├── OnboardingChecklist.jsx      # counter + ProgressBar + items; owns toggle state (FR-017)
    │   │       ├── ChecklistItem.jsx
    │   │       ├── ActivityFeed.jsx             # FR-018
    │   │       ├── ActivityFeedItem.jsx
    │   │       ├── QuickNavigation.jsx          # FR-019
    │   │       ├── ShortcutTile.jsx             # Link when `to`, inert button otherwise
    │   │       ├── RoleBreakdownCard.jsx        # FR-020
    │   │       ├── DonutChart.jsx               # inline SVG
    │   │       └── SecurityAdvisoryCard.jsx     # FR-021, static copy
    │   └── users/                               # NEW
    │       ├── UserManagementPage.jsx           # owns search/page/pageSize state; composition
    │       ├── api/
    │       │   ├── users.fixtures.js            # ≥21 users (7 from Stitch + generated), domain data only
    │       │   ├── users.schemas.js             # userSchema, userListResponseSchema
    │       │   ├── users.mockServer.js          # filterUsers, paginate — mock-only, deleted on swap
    │       │   ├── users.api.js                 # fetchUsers({ search, page, pageSize }) — swap point
    │       │   └── users.queries.js             # userKeys + useUsers(params) (ADR-6)
    │       └── components/
    │           ├── UsersPageHeader.jsx          # breadcrumb + title + description (FR-022)
    │           ├── UserSearchInput.jsx          # controlled (FR-023)
    │           ├── UserTable.jsx                # thead + rows + empty state (FR-024)
    │           ├── UserRow.jsx
    │           ├── RoleBadge.jsx
    │           └── StatusBadge.jsx
    ├── pages/
    │   ├── HomePage.jsx                         # DELETED (FR-014)
    │   └── NotFoundPage.jsx                     # unchanged
    └── test/
        ├── renderWithProviders.jsx              # NEW: fresh QueryClient(retry:false) + memory router + AuthContext value
        └── tailwindLegacyClasses.test.js        # NEW: fails on Stitch/v3-only class tokens (ADR-2, R-1)
```

`AuthProvider.jsx`, `RequireAuth.jsx`, `useAuth.js`, `auth.schemas.js`, `lib/formikZod.js`, `lib/apiClient.js`, `Providers.jsx`, `store.js`, `queryClient.js`, and all of `apps/api` are **not modified**.

### Component diagram

```
<Providers>  (unchanged: Redux · QueryClientProvider · AuthProvider · RouterProvider)
 └ router
    ├ (pathless) RedirectIfAuthenticated ── 'authenticated' → <Navigate to="/" replace/>; 'loading' → null
    │   └ /login ─────────► LoginPage
    │                        ├ LoginBackdrop
    │                        ├ LoginBrandHeader ── Icon
    │                        ├ <Formik> (unchanged config)
    │                        │   ├ AuthTextField(email, icon=alternate_email)
    │                        │   ├ AuthTextField(password, icon=lock, trailing=<toggle>)   [useState: showPassword]
    │                        │   ├ remember checkbox                                      [useState: remember — NOT Formik]
    │                        │   └ submit button (disabled while isSubmitting)
    │                        ├ SsoButtons (type="button", no handlers)
    │                        ├ PortalStatusStrip
    │                        └ LoginFooter
    ├ (pathless) RequireAuth ── status==='unauthenticated' → <Navigate to="/login" replace/>; 'loading' → null
    │   └ (pathless) AppShell
    │       ├ Sidebar ── navigation.js ── SidebarNavItem ×6 ── NavLink | useSignOut | inert
    │       ├ TopHeader ── HeaderIdentity ── useIdentity ── useAuth
    │       └ <main><Outlet/></main>
    │           ├ '/'      DashboardPage
    │           │           ├ WelcomeBanner ── useIdentity
    │           │           ├ KpiGrid ── useDashboardKpis ─────────┐
    │           │           ├ OnboardingChecklist ── useOnboardingChecklist ─┤
    │           │           ├ ActivityFeed ── useRecentActivity ─────┤  dashboard.queries → dashboard.api → (mock) fixtures
    │           │           ├ QuickNavigation ── QUICK_LINKS         │                          ↘ Zod parse
    │           │           ├ RoleBreakdownCard ── useRoleBreakdown ─┘
    │           │           │   └ DonutChart ── computeDonutSegments
    │           │           └ SecurityAdvisoryCard (static)
    │           └ '/users' UserManagementPage   [useState: search, page, pageSize]
    │                       ├ UsersPageHeader
    │                       ├ UserSearchInput
    │                       ├ UserTable ── UserRow ── Avatar · RoleBadge · StatusBadge
    │                       └ Pagination ── getPageItems
    │                         ▲ useUsers({search,page,pageSize}) → users.api → (mock) mockServer.filter/paginate → Zod parse
    └ *  NotFoundPage
```

### Data flow: dashboard dataset (FR-016/018/020, same shape for all four)

1. `KpiGrid` calls `useDashboardKpis()`.
2. The hook calls `useQuery({ queryKey: dashboardKeys.kpis(), queryFn: fetchDashboardKpis })`.
3. `fetchDashboardKpis()` (in `dashboard.api.js`) currently resolves `structuredClone(fixtures.kpis)` without network I/O, then returns `kpisSchema.parse(result)`.
4. The query resolves in a microtask. `QueryState` renders a card-sized skeleton for that frame, and the `StatCard`s render once data arrives.
5. **Future swap:** change line 3 to `await apiClient.get('/dashboard/kpis')`. The existing interceptor already unwraps `{ success, data }`. Nothing else changes: the hook, keys, components, Zod parse, and tests of components (tests of the fetcher change).

### Data flow: user list (FR-023/024/025)

1. `UserManagementPage` holds `search`, `page` (1-based), and `pageSize` (default 10) in `useState`.
2. It calls `useUsers({ search, page, pageSize })` → `queryKey: ['users', 'list', { search, page, pageSize }]`, `placeholderData: keepPreviousData` (no flicker between keystrokes/pages).
3. `fetchUsers(params)` is mock for now: `paginate(filterUsers(fixtures, search), page, pageSize)` → `{ items, total, page, pageSize }` → `userListResponseSchema.parse`.
4. Changing `search` or `pageSize` resets `page` to 1 in the same event handler (not in an effect).
5. `Pagination` gets `{ page, pageSize, total }` from the response and computes `totalPages`, "Showing X–Y of Z users", and button states.

### Data flow: sign-in redirect (FR-026)

1. The user submits valid credentials. `LoginPage`'s **unchanged** `onSubmit` awaits `supabase.auth.signInWithPassword(values)`.
2. On success, supabase-js persists the session and emits `SIGNED_IN` to its `onAuthStateChange` subscribers. The existing `AuthProvider` sets `{ session, user, status: 'authenticated' }`.
3. `RedirectIfAuthenticated` (the layout route around `/login`) re-renders, sees `status === 'authenticated'`, and returns `<Navigate to="/" replace />`. `LoginPage` unmounts. `RequireAuth` now sees `authenticated` and renders `AppShell` › `DashboardPage`.
4. **Already-authenticated visitor** (types `/login`, uses a bookmark, or presses Back): at the first render `status` is `'loading'`, so the guard renders `null`, exactly like `RequireAuth`. It then becomes `'authenticated'`, and step 3 applies. The login card never flashes.
5. **Failed sign-in:** Supabase returns `error`, no auth event fires, `status` stays `unauthenticated`, and the guard keeps rendering `<Outlet/>`. The `serverError` message shows as it does today.

`LoginPage` contains **no** `navigate()` call. Navigation is driven only by auth state (ADR-12).

### Data flow: logout (FR-011)

`Sidebar` Logout → `useSignOut().signOut()` → `await supabase.auth.signOut()` (on error: log, then `supabase.auth.signOut({ scope: 'local' })`) → `queryClient.clear()`. supabase-js emits `SIGNED_OUT`, `AuthProvider` sets `status: 'unauthenticated'`, `RequireAuth` renders `<Navigate to="/login" replace/>`, and `AppShell` unmounts. The button is disabled while the sign-out is pending.

### System boundaries

- **No backend change.** No new endpoint, env var, migration, or `apps/api` file.
- **Browser → Google Fonts CDN** (`fonts.googleapis.com`, `fonts.gstatic.com`) for the three text families and Material Symbols (ADR-7). This is the only new external origin.
- **Mock boundary:** each `*.api.js` fetcher is the only place that knows data is mocked. Components and hooks are mock-agnostic.
- **Trust boundary for future data:** each fetcher Zod-parses its result, so a real endpoint that drifts from the contract surfaces as a query error, not a render crash (ADR-5).

### Routing (FR-009, FR-013, FR-014, FR-022, FR-026)

```
[
  { element: <RedirectIfAuthenticated/>, children: [   // guest-only gate (FR-026)
      { path: ROUTES.login, element: <LoginPage/> },
  ]},
  { element: <RequireAuth/>, children: [            // gate first
      { element: <AppShell/>, children: [           // chrome second
          { index: true, element: <DashboardPage/> },     // '/'
          { path: 'users', element: <UserManagementPage/> },
      ]},
  ]},
  { path: '*', element: <NotFoundPage/> },
]
```

- **FR-013 ordering is structural.** `AppShell` is a *child* of `RequireAuth`, and `RequireAuth` renders `<Outlet/>` only when `status === 'authenticated'`. So `AppShell` cannot mount for an unauthenticated or still-loading visitor. No guard logic lives in `AppShell`.
- Sidebar Dashboard uses `<NavLink to="/" end>`. **`end` is mandatory**: without it `/` matches every path, and Dashboard would stay active on `/users`, breaking FR-009. `NavLink` sets `aria-current="page"` automatically, and tests assert on that.
- `HomePage.jsx` is deleted and its import removed (FR-014).
- `NotFoundPage` stays outside the shell. Unknown authenticated paths do not get chrome (unchanged behaviour).
- **FR-026 guard.** `/login` becomes the only child of a pathless `RedirectIfAuthenticated` layout route, the exact mirror of `RequireAuth`:

  | `status` | `RequireAuth` (around `/`, `/users`) | `RedirectIfAuthenticated` (around `/login`) |
  |---|---|---|
  | `'loading'` | `null` | `null` |
  | `'unauthenticated'` | `<Navigate to="/login" replace/>` | `<Outlet/>` |
  | `'authenticated'` | `<Outlet/>` | `<Navigate to="/" replace/>` |

  - **No redirect loop.** The two guards read the same `status` from the same context and redirect on opposite values. So for any single `status` value, at most one of them redirects, and the target route's guard renders its `<Outlet/>`.
  - **`replace` on both sides.** After signing in, Back cannot return to `/login`, and after logging out, Back cannot return to the dashboard.
  - **Wrapping style.** The guard wraps `/login` as a layout route rather than as `element: <RedirectIfAuthenticated><LoginPage/></RedirectIfAuthenticated>`. This keeps the same shape as `RequireAuth`, and any future guest-only route (e.g. sign-up, password reset) becomes another child.
  - **Redirect target is always `/`** (FR-026). There is no "return to the originally requested page", because `RequireAuth` does not record the `from` location today. That is a possible follow-up; it would need both guards changed together.

### Tailwind theme (FR-001): `apps/web/src/index.css`

Plain `@theme { … }` (not `@theme inline`), because every value is a literal. That also emits the values as `:root` CSS variables, which inline styles can use if needed. Only tokens actually referenced by the three Stitch screens are included (spec OQ resolution). Tailwind's default palette stays available: the designs also use `emerald-*`, `amber-*`, `cyan-500`, and `slate-950`.

**Colors: 27 of Stitch's ~45.** Names are kept as Stitch's Material 3 semantic role names (ADR-1).

| Token (`--color-…`) | Value | | Token (`--color-…`) | Value |
|---|---|---|---|---|
| `primary` | `#070235` | | `surface` | `#f8f9ff` |
| `on-primary` | `#ffffff` | | `on-surface` | `#0b1c30` |
| `primary-container` | `#1e1b4b` | | `on-surface-variant` | `#47464f` |
| `primary-fixed` | `#e3dfff` | | `surface-container-lowest` | `#ffffff` |
| `primary-fixed-dim` | `#c4c1fb` | | `surface-container-low` | `#eff4ff` |
| `on-primary-fixed-variant` | `#444173` | | `surface-container` | `#e5eeff` |
| `secondary` | `#4e45d5` | | `surface-container-high` | `#dce9ff` |
| `on-secondary` | `#ffffff` | | `surface-container-highest` | `#d3e4fe` |
| `secondary-container` | `#6860ef` | | `outline` | `#787680` |
| `secondary-fixed` | `#e3dfff` | | `error` | `#ba1a1a` |
| `on-secondary-fixed` | `#100069` | | `error-container` | `#ffdad6` |
| `on-secondary-fixed-variant` | `#372abf` | | `on-error-container` | `#93000a` |
| `tertiary-container` | `#002723` | | `tertiary-fixed` | `#89f5e7` |
| `on-tertiary-container` | `#1a998d` | | | |

Left out because none of the three screens use them: `tertiary`, `on-tertiary`, `tertiary-fixed-dim`, `on-tertiary-fixed*`, `outline-variant`, `background`, `on-background`, `surface-bright`, `surface-dim`, `surface-variant`, `surface-tint`, `inverse-*`, `on-primary-container`, `on-primary-fixed`, `on-secondary-container`, `secondary-fixed-dim`, `on-error`.

**Font families: three, collapsed from Stitch's 12 per-role aliases (ADR-1).**

| Token | Value | Replaces Stitch classes |
|---|---|---|
| `--font-sans` (overrides default, so it becomes the base font) | `'Inter', ui-sans-serif, system-ui, sans-serif` | `font-body-*`, `font-label-*` (dropped: inherited) |
| `--font-display` | `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif` | `font-display-lg`, `font-headline-*` |
| `--font-mono` (overrides default) | `'JetBrains Mono', ui-monospace, monospace` | `font-code-md` |

**Type scale: 11 of 12** (`headline-lg-mobile` is unused). Each is `--text-X` plus `--text-X--line-height`, `--text-X--letter-spacing` (where Stitch sets one), and `--text-X--font-weight`. In v4, an explicit `font-*`, `leading-*`, or `tracking-*` utility on the same element still wins, which matches the v3 CDN behaviour the designs were rendered with.

| Token | size / line-height / letter-spacing / weight |
|---|---|
| `display-lg` | 36px / 44px / -0.025em / 700 |
| `headline-lg` | 28px / 36px / -0.02em / 600 |
| `headline-md` | 20px / 28px / -0.015em / 600 |
| `headline-sm` | 16px / 24px / -0.01em / 600 |
| `body-lg` | 16px / 24px / — / 400 |
| `body-md` | 14px / 20px / — / 400 |
| `body-sm` | 12px / 16px / — / 400 |
| `label-lg` | 14px / 20px / — / 500 |
| `label-md` | 12px / 16px / 0.01em / 500 |
| `label-sm` | 11px / 14px / 0.03em / 600 |
| `code-md` | 12px / 18px / — / 400 |

**Spacing: 9 named values** (`margin-mobile` is unused). `--spacing-space-xs: 0.25rem`, `--spacing-space-sm: 0.5rem`, `--spacing-space-md: 1rem`, `--spacing-space-lg: 1.5rem`, `--spacing-space-xl: 2rem`, `--spacing-gutter-sm: 1rem`, `--spacing-gutter: 1.5rem`, `--spacing-gutter-lg: 2rem`, `--spacing-margin: 2rem`. These generate `p-space-md`, `gap-space-sm`, `space-y-space-md`, `px-gutter-lg`, `sm:p-margin`, and so on, exactly as in the Stitch markup. The numeric scale (`w-64`, `h-16`, `pt-16`) is unchanged.

**Radius: 2 overrides.** `--radius-lg: 0.25rem`, `--radius-xl: 0.5rem` (Stitch values; the v4 defaults are 0.5rem and 0.75rem). `rounded-full` is **not** overridden: v4's `rounded-full` is a static `calc(infinity * 1px)`, and the spec requires a *circular* logo and avatars (Stitch's `full: 0.75rem` would render a 40px logo as a squircle). Stitch's `DEFAULT`/`sm` (0.125rem) map to v4's built-in `rounded-xs`, so no token is needed (ADR-2).

**Base layer.** `@layer base { body { @apply bg-surface text-on-surface text-body-md antialiased; } }`. Stitch's global `::-webkit-scrollbar { display: none }` and `overscroll-behavior: none` are **not** carried over: hiding scrollbars app-wide is an accessibility regression, and nothing in the spec asks for it.

### Stitch (v3 CDN) → Tailwind v4 transcription rules (ADR-2)

Developers transcribe the Stitch markup class-for-class, except for these rules:

| Stitch class | Write instead | Why |
|---|---|---|
| `font-body-*`, `font-label-*` | *(omit)* | Inter is the base `--font-sans`. Preflight makes inputs and buttons inherit it. |
| `font-display-lg`, `font-headline-*` | `font-display` | ADR-1 |
| `font-code-md` | `font-mono` | ADR-1 |
| `rounded` (bare), `rounded-sm` | `rounded-xs` | Stitch radius is 0.125rem. v4 `rounded-sm` is 0.25rem. |
| `shadow-sm` | `shadow-xs` | v4 renamed v3 `shadow-sm` to `shadow-xs`. |
| `flex-shrink-0` | `shrink-0` | `flex-shrink-*` was removed in v4. |
| `outline-none` | `outline-hidden` | v4 `outline-hidden` keeps v3 `outline-none` semantics (forced-colors safe). |
| `material-symbols-outlined text-[Npx]` span | `<Icon name=… size={N} />` | ADR-7 |
| `viewbox=` (Stitch typo on the donut SVG) | `viewBox=` | React/SVG DOM is case-sensitive; lowercase is ignored. |
| `href="#"` on inert items | `<button type="button">` | No hash navigation (FR-010, FR-019). |
| inline `style="width: 85%"` | `ProgressBar value={…}` | Dynamic values need inline style, not generated classes. |

All other Stitch classes (`rounded-lg`, `rounded-xl`, `rounded-full`, `blur-*`, `backdrop-blur-xl`, `shadow-md`/`xl`, arbitrary `shadow-[…]`, opacity modifiers like `bg-secondary/10`, and the default-palette colors) behave the same in v4 with the theme above.

**Class-literal rule (Tailwind detection):** every class string must appear literally in source. Variant maps (`STATUS_STYLES`, `ROLE_STYLES`, `ROLE_TONES`, `CATEGORY_STYLES`, avatar tones) are object literals of full class strings. Class names are never built by interpolation (`bg-${tone}`).

### Component contracts

Props are listed as `name: type (default)`. Components are presentational unless marked **(data)**, which means they call exactly one query hook.

**Shared primitives (`src/components/`)**

| Component | Props | Notes |
|---|---|---|
| `Icon` | `name: string`, `size: number (20)`, `filled: bool (false)`, `className: string ('')`, `label?: string` | Renders `<span class="material-symbols-outlined …">{name}</span>` with `style={{ fontSize: size, fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}`. Sets `aria-hidden="true"` unless `label` is given, in which case it sets `role="img" aria-label={label}`. |
| `Avatar` | `name: string`, `src?: string\|null`, `size: 'sm'\|'md' ('md')` (sm = `w-8 h-8`, md = `w-9 h-9`), `className` | `img` with `alt={name}`. `onError` falls back to initials. The initials circle uses `toneFor(name)` → one of 4 literal Stitch tone pairs (`bg-secondary-fixed text-on-secondary-fixed`, `bg-error-container text-on-error-container`, `bg-surface-container-highest text-on-surface`, `bg-primary-container text-primary-fixed-dim`). |
| `Card` | `as: string ('section')`, `className`, `children` | Base: `rounded-xl bg-surface-container-lowest p-space-lg shadow-xs`. |
| `ProgressBar` | `value: number (0–100, clamped)`, `size: 'sm'\|'md' ('md')` (h-1.5 / h-2), `label: string` | `role="progressbar" aria-valuenow aria-valuemin=0 aria-valuemax=100 aria-label`. Fill width comes from inline style. |
| `QueryState` | `query: UseQueryResult`, `skeleton: ReactNode`, `errorMessage: string`, `children: (data) => ReactNode` | `isPending` → skeleton, `isError` → `<p role="alert">` in `text-error`, success → `children(query.data)`. |
| `Pagination` | `page: number`, `pageSize: number`, `total: number`, `onPageChange(n)`, `onPageSizeChange(n)`, `pageSizeOptions: number[] ([10,25,50,100])`, `itemLabel: string ('items')` | Summary is "Showing **X–Y** of **Z** {itemLabel}", or "0–0 of 0" when empty. Prev is disabled on page 1, Next on the last page. Page buttons use `aria-label="Page n"` and the active one gets `aria-current="page"` plus `bg-secondary text-on-secondary`. Ellipses come from `getPageItems`. |

`getPageItems(page, totalPages)`: if `totalPages ≤ 7`, return `[1..totalPages]`; otherwise return `[1, '…'?, page-1, page, page+1, '…'?, totalPages]`, deduplicated and clamped. Pure and unit-tested.

**Shell (`features/shell/`)**

| Component | Props / contract |
|---|---|
| `AppShell` | No props. `<div class="min-h-screen bg-surface"><Sidebar/><div class="pl-64"><TopHeader/><main class="relative pt-16 bg-surface w-full min-h-screen px-gutter-lg py-gutter"><Outlet/></main></div></div>` (Stitch layout classes). |
| `Sidebar` | No props. Renders the brand block (logo image + `BRAND_LABEL`, see OI-2) and `<nav aria-label="Primary">` from `PRIMARY_NAV`, plus the pinned footer group from `FOOTER_NAV`. Wires `logout` to `useSignOut`. |
| `SidebarNavItem` | `item: { key, label, icon, to?, end? }`, `onSelect?: () => void`, `disabled?: bool`. With `to`, it renders a `NavLink` whose className function applies the active (`bg-secondary text-on-secondary`) or idle (`text-primary-fixed-dim hover:bg-primary-container hover:text-on-primary`) literal. With `onSelect`, it renders `<button type="button">`. With neither, it renders `<button type="button" aria-disabled="true">` and no handler (FR-010). |
| `navigation.js` | `PRIMARY_NAV = [dashboard(to '/', end), users(to '/users'), analytics, settings]`, `FOOTER_NAV = [support, logout]`. Icons: `home`, `group`, `bar_chart`, `settings`, `help`, `logout`. |
| `TopHeader` | No props. Search is an uncontrolled `<input aria-label="Search" placeholder="Search operations, users, metrics...">` with no handlers. The bell is `<button type="button" aria-label="Notifications">` with a static `bg-error` dot and no handler. Then `HeaderIdentity`. |
| `HeaderIdentity` | No props. `useIdentity()` → `Avatar(name=fullName, src=null, size='sm')`, `fullName` (label-md), `roleLabel` (label-sm), then `Icon expand_more`. It is a non-interactive `div`: no button, no menu (FR-012). |

**Auth (`features/auth/`)**

| Unit | Contract |
|---|---|
| `AuthTextField` | `name`, `label`, `type`, `placeholder`, `icon`, `trailing?: ReactNode`, `autoComplete`. Uses Formik `useField(name)`. Renders the label, a relative wrapper with the leading `Icon`, the input (Stitch classes plus `aria-invalid` and `aria-describedby` when touched and invalid), the trailing slot, and the error `<p id="{name}-error" class="text-body-sm text-error">`. Error text comes from Formik meta, which comes from the unchanged `loginSchema`. |
| `LoginPage` | Keeps `initialValues`, `validate`, and the `onSubmit` body **byte-for-byte**. Adds `const [showPassword, setShowPassword] = useState(false)` and `const [remember, setRemember] = useState(false)`. The password field uses `type={showPassword ? 'text' : 'password'}`, and the trailing `<button type="button" aria-label="Show password"/"Hide password" aria-pressed>` swaps `visibility` ↔ `visibility_off`. |
| `RedirectIfAuthenticated` | No props. `const { status } = useAuth()`. It returns `null` for `'loading'`, `<Navigate to={ROUTES.dashboard} replace />` for `'authenticated'`, and `<Outlet />` otherwise. It is structurally identical to `RequireAuth.jsx` with the condition inverted, about 15 lines, and has no side effects (FR-026, ADR-12). |
| `deriveIdentity(user)` | Returns `{ fullName, firstName, initials, roleLabel }` (ADR-9). |
| `useSignOut()` | Returns `{ signOut: () => Promise<void>, isSigningOut: bool }` (ADR-10). |

**Login restyle constraints (FR-003/004/005 "unchanged")**

- The remember-device checkbox is **local `useState`, not a Formik field**. Adding it to `initialValues` would change the object passed to `signInWithPassword(values)`, and FR-005 requires that call to stay exactly as it is today.
- SSO buttons, the divider, the status strip, and the footer render **outside** `<Form>`, so they can never submit. The SSO buttons are `type="button"` with no `onClick` (FR-006).
- "Forgot password?" renders as a `type="button"` styled like a link, with no handler (spec out-of-scope).
- The submit button reads "Enter BrainX Workspace" with a trailing `arrow_forward`. While `isSubmitting` it gets `disabled`, `aria-busy="true"`, `disabled:opacity-60 disabled:cursor-not-allowed`, and the trailing icon becomes a spinning `progress_activity`.
- Copy and ids: label "Work Email", input `id/name="email"`, placeholder `name@company.com`; label "Password", input `id/name="password"`, placeholder `••••••••••••`. The `serverError` block is kept and restyled with `text-error`.

**Dashboard (`features/dashboard/components/`)**

| Component | Props / contract |
|---|---|
| `WelcomeBanner` | No props. `useIdentity().firstName` → heading "Welcome back, {firstName}!" followed by `<span aria-hidden="true"> 👋</span>`. The env badge "Production Realm · us-east-1", "v4.12.0", the subtext, and the two banner buttons ("View Audit Log", "Invite Team Member") are static and inert (`type="button"`, no handler). |
| `KpiGrid` **(data)** | `useDashboardKpis()` inside `QueryState` with 4 card skeletons. Explicitly composes four `StatCard`s. The footers differ by nature, so there is no generic loop: `TrendPill` + "vs last month"; `ProgressBar(value=allocated/total)` + "255 allocated / 300 total"; pinging emerald dot + "All systems nominal" + "0 incidents"; amber "Requires review" tag + inert "Review →" button. |
| `StatCard` | `label: string`, `value: ReactNode`, `valueSuffix?: string`, `icon: string`, `iconTone: 'secondary'\|'success'\|'warning'`, `children` (footer slot). Uses Stitch card classes and a literal tone map. |
| `TrendPill` | `changePct: number`. `≥0` → `trending_up`, `bg-emerald-50 text-emerald-700`, `+x.x%`. `<0` → `trending_down`, `bg-error-container text-on-error-container`. |
| `OnboardingChecklist` **(data)** | `useOnboardingChecklist()` → items. Owns `const [overrides, setOverrides] = useState({})`. For each item, `completed = overrides[id] ?? item.completed`. Renders the "N of 4 done" counter, "X% completed", `ProgressBar(size='sm')`, and the `ChecklistItem`s (ADR-8). |
| `ChecklistItem` | `item: { id, title, description, actionLabel }`, `completed: bool`, `onToggle(id)`. The row `div` owns `onClick={() => onToggle(id)}`. The icon and text sit inside an inner `<button type="button" aria-pressed={completed}>` **with no handler of its own**: its click, including keyboard Enter/Space, bubbles to the row, so each activation toggles exactly once. The trailing element is a "Completed" tag when completed, otherwise an inert action button with `onClick={e => e.stopPropagation()}` so it does not toggle (same as Stitch). Completed styling: `check_circle` filled `text-secondary`, title `line-through text-outline`, row `bg-surface-container-low`. Incomplete: `radio_button_unchecked` `text-outline`. |
| `ActivityFeed` **(data)** | `useRecentActivity()` → header ("Recent Organization Activity", inert "View Full Log") + a `divide-y` list of `ActivityFeedItem`, in fixture order. |
| `ActivityFeedItem` | `entry: ActivityEntry` (see Data model). Actor avatar: user → `Avatar`; system → `bg-primary` circle with `Icon`. Description: `<strong>{actor.name}</strong> {summary} {target}`, where the target is rendered as a code chip or emphasis span from `target.format`. Built as JSX, never HTML strings. Meta: `formatRelativeTime(occurredAt)` · category label, with the category colour and trailing type icon from literal maps. |
| `QuickNavigation` | No props. Renders `QUICK_LINKS`: `[{ key:'users', title:'User Management', description:'Roles, teams, directory', icon:'manage_accounts', to: ROUTES.users }, security (lock_person), apiKeys (vpn_key), permissions (shield)]`. Only `users` has a `to`. |
| `ShortcutTile` | `title`, `description`, `icon`, `to?`. With `to` → `<Link>`, otherwise `<button type="button">` with no handler (FR-019). Both use Stitch `group` hover classes. |
| `RoleBreakdownCard` **(data)** | `useRoleBreakdown()` → `{ roles: [{ key, label, count }] }`. `total = Σcount` ("2,845 total"). Legend rows follow fixture order (Admins, Editors, Viewers): swatch, label, count (`formatNumber`), and percent (`formatPercent`). `DonutChart` gets the roles in reverse fixture order, which reproduces Stitch's arc placement (Viewers from 12 o'clock). Footer "SSO sync executed 14 mins ago" + inert "Force Sync". |
| `DonutChart` | `segments: [{ key, value, strokeClass }]`, `centerLabel: string ('100%')`, `centerCaption: string ('Allocated')`, `ariaLabel: string`. Renders `<svg viewBox="0 0 100 100" class="w-full h-full -rotate-90" role="img" aria-label>`: a background ring (`r=38`, `stroke-width=12`, `text-surface-container-high`), then one `<circle stroke="currentColor" strokeDasharray strokeDashoffset>` per `computeDonutSegments` output. |
| `SecurityAdvisoryCard` | No props, no hook. Static heading and body in a `bg-primary text-on-primary` card (FR-021). |

`computeDonutSegments(values, { radius = 38 })` (pure, `lib/donut.js`):
- `C = 2πr` (≈ 238.76 at r = 38) and `total = Σvalue`. If `total === 0`, return `[]` (background ring only).
- For each value in order: `fraction = value/total`, `length = fraction·C`, `dashArray = "${round2(length)} ${round2(C)}"`, `dashOffset = -round2(cumulativeLengthBefore)`.
- The legend percentage uses the **same** `fraction` (`Math.round(fraction·100)`), so chart and legend cannot disagree (FR-020). With the Stitch counts 285/853/1,707 this gives 10/30/60% and dash arrays within 0.01 of Stitch's hand-written values.

**Users (`features/users/components/`)**

| Component | Props / contract |
|---|---|
| `UsersPageHeader` | No props. Breadcrumb `<nav aria-label="Breadcrumb">` "Organization / **Access Control**" (`font-mono text-code-md uppercase`), `h1` "User Management", and the description. |
| `UserSearchInput` | `value: string`, `onChange(value)`. `aria-label="Search users"`, placeholder "Search users by name or email...". |
| `UserTable` | `users: User[]`. The `thead` has User / Role / Status (right-aligned). With zero rows it shows a single full-width row "No users match your search." |
| `UserRow` | `user: User`, `index: number`. Odd rows get `bg-surface/30` (Stitch zebra), and every row gets `hover:bg-surface-container-low/70 transition-colors` (FR-024). User cell: `Avatar` + name (label-lg semibold) stacked over email (body-sm). |
| `RoleBadge` | `role: 'administrator'\|'manager'\|'member'\|'guest'`. Literal map to Stitch classes and labels (Administrator, Manager, Member, Guest). |
| `StatusBadge` | `status: 'active'\|'pending'\|'inactive'`. Literal map: active `bg-tertiary-fixed/30 text-tertiary-container` with dot `bg-on-tertiary-container`; pending `bg-primary-fixed text-on-primary-fixed-variant` with dot `bg-secondary`; inactive `bg-error-container text-on-error-container` with dot `bg-error`. |
| `UserManagementPage` | `search`, `page`, `pageSize` state. `handleSearch(v) { setSearch(v); setPage(1) }`, `handlePageSize(n) { setPageSize(n); setPage(1) }`. Composition: header, search ribbon card, table card containing `UserTable` + `Pagination(itemLabel='users')`. |

The "Rows per page" select from the Stitch markup is rendered and **functional** (changes `pageSize`, resets to page 1). It costs almost nothing with ADR-6's contract, and a visible select that does nothing is a UX defect. This is a small interpretation beyond FR-025 and is logged in notes.md.

## Tech stack & rationale

**No new npm dependencies, runtime or dev (ADR-11).** Everything uses libraries already pinned in `apps/web/package.json`.

| Need | Uses | Notes |
|---|---|---|
| Design tokens | Tailwind v4.3.3 `@theme` in `index.css` | ADR-1, ADR-2 |
| Layout routes, active nav | react-router 7.9.6 `createBrowserRouter`, `NavLink`, `Link`, `Outlet` | ADR-4 |
| Mock server-state | @tanstack/react-query 5.x `useQuery`, `keepPreviousData` | ADR-5, ADR-6 |
| Response contracts | zod (catalog v4) | ADR-5: parses fetcher output |
| Login form | formik 2.4.9 (`useField` in `AuthTextField`) and existing `toFormikValidate` | No validation change |
| Sign-out | @supabase/supabase-js (existing `lib/supabase.js`) | ADR-10 |
| Icons | Material Symbols Outlined variable font via Google Fonts CSS | ADR-7 (spec-resolved) |
| Text fonts | Inter 400/500/600, JetBrains Mono 400, Plus Jakarta Sans 600/700 via Google Fonts CSS | The same weights Stitch loads. Other weights are browser-synthesised, as in the reference render. |
| Donut | Inline SVG + pure `computeDonutSegments` | Spec-resolved, no chart lib |
| Relative time / numbers | `Intl.RelativeTimeFormat('en', { numeric: 'auto' })`, `Intl.NumberFormat('en-US')` | Built into the browser |
| Tests | Vitest + RTL + jest-dom (existing) | `renderWithProviders` helper |

**Deviations from CLAUDE.md:** none. No CLAUDE.md update is required.

## Data model

**Database:** no change, and no migration.

**Response contracts** (Zod schemas in `*.schemas.js`; fixtures must satisfy them, and a test asserts this). Fixtures hold **domain data only**. Presentation (icons for event types, colours for categories and roles) lives in component-level literal maps, so a real backend never has to send Tailwind classes.

| Schema | Shape | Fixture content |
|---|---|---|
| `kpisSchema` | `{ activeUsers: { value: int, changePct: number }, licenses: { allocated: int, total: int>0 }, systemHealth: { uptimePct: number, incidents: int, status: 'nominal' }, pendingAccess: { count: int } }` | 2845 / +12.4; 255 of 300; 99.98 / 0 / nominal; 14 |
| `activityListSchema` | `ActivityEntry[]`, where `ActivityEntry = { id, actor: { name, kind: 'user'\|'system', avatarUrl: string\|null }, summary: string, target: { label, format: 'code'\|'emphasis' } \| null, occurredAt: ISO string, category: 'secops'\|'access-control'\|'automation'\|'governance', type: 'token-created'\|'access-approved'\|'key-rotation'\|'role-schema-changed' }` | The 4 Stitch entries. `occurredAt` is computed at module load as `now − {8m, 42m, 2h, 4h}`, so the relative labels always read like the design. |
| `roleBreakdownSchema` | `{ roles: [{ key: 'admins'\|'editors'\|'viewers', label, count: int≥0 }] }` | 285 / 853 / 1,707 |
| `onboardingChecklistSchema` | `[{ id, title, description, completed: bool, actionLabel: string }]` | The 4 Stitch items, first two completed |
| `userSchema` | `{ id, name, email, role: 'administrator'\|'manager'\|'member'\|'guest', status: 'active'\|'pending'\|'inactive', avatarUrl: string\|null }` | 7 Stitch users (Marcus Vance, Elena Rostova, Tariq Al-Mansoor, Chloe Chen, Devon Kowalski, Sofia Ortiz, Kenji Nakamura) plus generated users, **24 total** (3 pages at size 10; 10/10/4), covering every role and status |
| `userListResponseSchema` | `{ items: User[], total: int (count after filter), page: int≥1, pageSize: int≥1 }` | Produced by `users.mockServer.js` |

**Query keys:**
- `dashboardKeys = { all: ['dashboard'], kpis: () => [...all, 'kpis'], activity: () => [...all, 'activity'], roleBreakdown: () => [...all, 'role-breakdown'], onboarding: () => [...all, 'onboarding'] }`
- `userKeys = { all: ['users'], list: (params) => [...all, 'list', params] }`

**Mock search semantics (FR-023):** `filterUsers(users, search)` trims the query and lowercases it. An empty query returns all users. Otherwise it keeps a user when `name.toLowerCase().includes(q) || email.toLowerCase().includes(q)`. **Paginate:** `total = filtered.length`, `items = filtered.slice((page-1)·pageSize, page·pageSize)`.

**Derived identity (ADR-9):** `deriveIdentity(user)`:
- `local = email.split('@')[0]`, split on `[._+-]`, empty parts dropped, each word title-cased. `fullName` joins the words ("deepti.jakhotra" → "Deepti Jakhotra"); `firstName` is the first word; `initials` are the first letters of the first two words, uppercased.
- `roleLabel = titleCase(user.app_metadata?.role) || 'Member'`.
- If `user` or `email` is missing, it returns `{ fullName: 'there', firstName: 'there', initials: '?', roleLabel: 'Member' }`, so the welcome line reads "Welcome back, there!".

**Client (non-server) state:** everything is component-local `useState`. That covers `showPassword` and `remember` (LoginPage), `overrides` (OnboardingChecklist), `search`/`page`/`pageSize` (UserManagementPage), and `isSigningOut` (useSignOut). Redux gets no new state (ADR-8).

## API contracts

**No new or changed backend endpoints.** The error-envelope convention (`{ success: false, error: { code, message } }`, boilerplate ADR-3) is untouched because no error-producing server code is added.

**Implied future contracts (non-binding, for the feature that replaces the mocks):** each fetcher's Zod schema is the `data` payload the future endpoint must return inside the standard `{ success: true, data }` envelope.

| Fetcher (swap point) | Future call | `data` must satisfy |
|---|---|---|
| `fetchDashboardKpis()` | `GET /api/v1/dashboard/kpis` | `kpisSchema` |
| `fetchRecentActivity()` | `GET /api/v1/dashboard/activity` | `activityListSchema` |
| `fetchRoleBreakdown()` | `GET /api/v1/dashboard/role-breakdown` | `roleBreakdownSchema` |
| `fetchOnboardingChecklist()` | `GET /api/v1/onboarding/checklist` | `onboardingChecklistSchema` |
| `fetchUsers({ search, page, pageSize })` | `GET /api/v1/users?search=&page=&pageSize=` | `userListResponseSchema` |

The endpoint paths are suggestions. The future feature's spec owns them.

## Integration points

| Integration | Direction | Details |
|---|---|---|
| Supabase Auth (browser) | web → Supabase | Existing `signInWithPassword` (unchanged). New: `auth.signOut()` from `useSignOut`, with fallback `signOut({ scope: 'local' })`. Session and `onAuthStateChange` stay owned by the existing `AuthProvider`. |
| Google Fonts CSS API | browser → `fonts.googleapis.com` / `fonts.gstatic.com` | `index.html` adds `preconnect` to both origins (the gstatic one with `crossorigin`), text fonts `family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Plus+Jakarta+Sans:wght@600;700&display=swap`, and icons `family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block`. That is **one** icon stylesheet. Stitch's duplicate static `opsz,wght,FILL,GRAD@24,400,0,0` link is dropped because the variable one covers it. |
| TanStack Query cache | in-process | Five mocked datasets. `queryClient.clear()` runs on logout. The existing `shouldRetry` defaults are unchanged. |
| Backend API | — | Not called by this feature (`GET /me` is not used; identity comes from the session). |

No queues, events, webhooks, or env vars.

## Test strategy (feeds tasks.md `Verify:` lines)

- **Pure unit tests:** `computeDonutSegments` (Stitch counts → 10/30/60, offsets, zero total), `getPageItems` (≤7 and >7 pages, edges), `filterUsers`/`paginate` (case-insensitivity, email match, trim, empty result, last partial page), `deriveIdentity` (dotted/underscored/plus local parts, missing email, `app_metadata.role`), `formatRelativeTime` (injected `now`), and a check that every fixture passes its schema.
- **Component tests (RTL):** use `renderWithProviders` with a fresh `QueryClient({ defaultOptions: { queries: { retry: false } } })`, `createMemoryRouter` with the real route tree, and `<AuthContext.Provider value={…}>`. `lib/supabase.js` is `vi.mock`ed, and queries are awaited with `findBy*`.
- **Login invariant (FR-005):** assert `signInWithPassword` was called with exactly `{ email, password }`, with no `remember` key, even when the checkbox is ticked.
- **FR-026 redirect:** render the real route tree at `/login` with `AuthContext` set to `authenticated`, and assert that the dashboard renders (the login heading is absent). With `unauthenticated`, the login form renders. With `loading`, neither renders. For the post-sign-in path, `vi.mock` `lib/supabase.js` with a fake `onAuthStateChange` emitter so the **real** `AuthProvider` is exercised. `signInWithPassword` resolves `{ error: null }` and fires `SIGNED_IN` with a fake session. Assert the dashboard appears, `LoginPage` made no `navigate` call, and the history entry was replaced. Also add a no-loop test: toggle the context between `authenticated` and `unauthenticated` and assert each settles on a single route.
- **Legacy-class guard (ADR-2, R-1):** `tailwindLegacyClasses.test.js` globs `src/**/*.jsx` and fails on the tokens `font-(display-lg|headline-|body-|label-|code-)`, `flex-shrink-`, `flex-grow-`, and bare `rounded`, all of which v4 would otherwise silently ignore or mis-size.
- **FR-001:** `index.css` token assertions (the test reads the file and checks each `--color-*`/`--font-*` literal), plus a manual check after `pnpm --filter web build && pnpm --filter web preview`: DevTools computed style on the login heading shows `font-family: "Plus Jakarta Sans"…` and `color: rgb(11, 28, 48)`.
- **Visual parity (spec technical requirement):** a manual side-by-side at 1440px width against the three Stitch HTML files. There is no automated visual regression (out of scope; R-8).

## Constitution check

Gate: every item must be checked before tasks can start. Re-evaluate after any scope change.

- [x] No new infrastructure dependency introduced without an ADR. No npm packages are added (ADR-11). The one new external runtime origin, the Google Fonts CDN, is covered by ADR-7 and ADR-11.
- [x] All API errors follow `{ error: string }` shape. **N/A:** the feature adds no endpoints and no server code. The project's justified `{ success: false, error: { code, message } }` exception (boilerplate ADR-3) is unaffected. Client-side error surfaces (query errors, login `serverError`) display messages only and never raw stacks.
- [x] No business logic in route handlers; the service layer owns it. **Backend N/A** (no route handlers touched). Frontend analogue: route elements are composition-only pages, and all logic lives in pure modules (`donut.js`, `pageItems.js`, `users.mockServer.js`, `identity.js`, `format.js`) and hooks (`*.queries.js`, `useSignOut`, `useIdentity`).
- [x] All secrets managed via environment variables, never hardcoded. No new env vars or secrets. Google Fonts needs no key. No `VITE_` variable is added.
- [x] No new npm dependency (runtime or dev) — ADR-11.
- [x] Redux holds no API data. This feature adds **no** Redux state; `uiSlice` is untouched (ADR-8).
- [x] All server-shaped data, including the mocks, is served through TanStack Query hooks, and components never import fixtures directly (ADR-5).
- [x] Zod validates runtime data at the boundary: every fetcher parses its result against a response schema. `loginSchema` is unchanged.
- [x] `LoginPage` Formik `initialValues`, `validate`, and `onSubmit` body are unchanged; the remember checkbox stays out of Formik; a test asserts the exact `signInWithPassword` argument.
- [x] `RequireAuth` gates before `AppShell` mounts (nested layout routes). `AppShell` contains no auth-guard logic (ADR-4).
- [x] `/login` is guarded by `RedirectIfAuthenticated`, which mirrors `RequireAuth` with complementary conditions (no redirect loop). `LoginPage`'s `onSubmit` stays unchanged, with no imperative `navigate()`, and navigation is driven only by auth state (FR-026, ADR-12).
- [x] No hash-link or placeholder navigation: inert controls are `<button type="button">` with no handler (FR-006/010/019, header).
- [x] Tailwind class strings are literal (no interpolated class names). Stitch→v4 transcription rules are enforced by `tailwindLegacyClasses.test.js` (ADR-2).
- [x] No `dangerouslySetInnerHTML`. Activity descriptions are built from structured fixture fields as JSX.
- [x] No hot-linked third-party images. Stitch images are committed locally, with an initials fallback on load error (ADR-11).
- [x] Role label is never read from user-editable `user_metadata` (ADR-9).
- [x] Plain JavaScript/JSX only; all async work uses async/await.
- [x] Every FR-001…FR-026 is traceable to a component (see FR traceability).

## Architecture Decision Records (ADRs)

### ADR-1: Design-token naming — Stitch's Material 3 role names for colors and type scale, three collapsed font families, subset only

- **Problem:** FR-001 needs Stitch tokens as Tailwind theme values. The repo has no existing naming convention (`index.css` is a bare import), so this feature sets it. Stitch exports ~45 colors with Material 3 role names, 12 font-family aliases that resolve to only 3 typefaces, 12 type roles, 10 spacing names, and 4 radius overrides.
- **Options considered:**
  - (a) Copy the whole Stitch config verbatim, including all 12 font aliases. This gives zero translation and maximal fidelity, but it contradicts the resolved "subset only" decision and ships 12 redundant `--font-*` variables that invite `font-label-md` vs `font-body-md` inconsistency for identical output.
  - (b) Rename into a brand scale (`brand-900`, `indigo-50`…). This looks familiar, but every Stitch class must then be translated by hand through a lookup table, it loses Material 3's `on-*` pairing semantics (which foreground belongs on which background), and future Stitch exports would need the same translation.
  - (c) Keep Material 3 role names for colors and the type scale, collapse the 12 font aliases into `--font-sans`/`--font-display`/`--font-mono`, and include only the tokens the three screens reference.
- **Chosen solution:** (c), with the exact token list in "Tailwind theme".
- **Reasoning:** The Material 3 names are already *semantic* (not hex-keyed), and they are what every future Stitch export will emit, so color and size classes transcribe 1:1. The `on-*` pairing also encodes accessible contrast choices. Font families are the one place Stitch's naming is redundant: three typefaces don't need twelve names. Overriding `--font-sans` also makes Inter the document default, which removes most font classes entirely. The accepted tradeoffs:
  - Font classes need a mechanical translation (ADR-2), which is guarded by a test.
  - Tokens for future screens must be added on demand (spec decision).
  - Material 3 names like `surface-container-high` are verbose.

### ADR-2: Stitch v3-CDN markup is transcribed with a fixed rule table, plus an automated legacy-class guard

- **Problem:** Stitch markup targets the Tailwind v3 Play CDN with a JS config, and the app runs Tailwind v4.3.3. Several classes changed meaning or no longer exist (`shadow-sm`, `rounded`/`rounded-sm`, `flex-shrink-0`, `outline-none`), Stitch overrides radius names, and v4 **silently emits nothing** for an unknown class. So a mistake shows up as visual drift, not as an error.
- **Options considered:**
  - (a) Paste the markup verbatim and add compatibility shims (`@utility font-body-md {…}` for each Stitch alias, a `--radius` default, redefined `shadow-sm`). This minimises translation, but it redefines core Tailwind names project-wide, and the shims become permanent legacy.
  - (b) Override every Stitch radius, including `full: 0.75rem`. That gives exact Stitch geometry, but the logo and avatars stop being circular, which contradicts FR-002 ("circular logo image").
  - (c) Transcribe with a small documented rule table, override only `--radius-lg` and `--radius-xl` (so the many `rounded-lg`/`rounded-xl` classes copy verbatim), map `rounded`/`rounded-sm` to v4's built-in `rounded-xs`, leave `rounded-full` as a true circle, and add a Vitest guard that fails on known legacy tokens.
- **Chosen solution:** (c).
- **Reasoning:** The rule table is short (about 10 rows) and mechanical. The two radius overrides cover the classes that appear most often in the markup, so most classes copy unchanged. The guard test turns v4's silent failure mode into a red build. Accepted tradeoffs:
  - `rounded-lg`/`rounded-xl` now mean 4px/8px app-wide instead of Tailwind's 8px/12px defaults. This is documented with a comment in `index.css`, and nothing existing depends on the defaults (the old `LoginPage`/`HomePage` markup is being replaced).
  - The guard only catches known tokens, so `shadow-sm` → `shadow-xs` remains a review-checklist item, because `shadow-sm` is still a valid v4 class.

### ADR-3: Feature-folder component structure; shared primitives in `apps/web/src/components/`, not `packages/ui`

- **Problem:** Three screens and a shell yield roughly 40 components. Without a plan they collapse into one giant file per page, or into a flat, ownerless `components/` dump.
- **Options considered:**
  - (a) One file per screen. This matches the Stitch files, but FR-017/023/025 interactivity and the hook boundaries become untestable in isolation, and the pieces used by both pages (`Avatar`, `Icon`, `Card`) get duplicated.
  - (b) Put all components in `packages/ui` (`@brainx/ui`). It is reusable in principle, but the components depend on tokens defined in `apps/web/src/index.css`, the package would need an `@source` directive (boilerplate ADR-11), and it has exactly one consumer. That is premature extraction.
  - (c) Feature folders (`features/shell`, `features/dashboard`, `features/users`, extending the existing `features/auth` convention), each with `components/`, `api/`, and `lib/`. Primitives used across features go in `src/components/`. Pages are composition-only and live in their feature folder, as `LoginPage` already does.
- **Chosen solution:** (c).
- **Reasoning:** It follows the convention the repo already uses (`features/auth/LoginPage.jsx`, `features/ui/uiSlice.js`), keeps ownership obvious, and puts each data hook next to the component that consumes it. A component moves to `src/components/` only when a second feature needs it (`Avatar` is used by the shell, dashboard, and users; `Pagination` is generic). Accepted tradeoffs:
  - `packages/ui` stays a placeholder until a second app exists.
  - Config constants (`navigation.js`, `quickLinks.js`) live in separate `.js` files to satisfy the existing `react-refresh/only-export-components` lint rule.

### ADR-4: Nested pathless layout routes — `RequireAuth` › `AppShell` › pages

- **Problem:** FR-013 needs `AppShell` around every authenticated route, and requires that an unauthenticated visitor is redirected **before** `AppShell` renders.
- **Options considered:**
  - (a) `AppShell` calls `useAuth()` and redirects itself. This merges two responsibilities, and every future shell variant has to remember to re-implement the guard.
  - (b) Wrap each page element in `<AppShell>` inside the route definitions. That repeats the wrapper per route, and the shell remounts on every navigation (the sidebar re-renders, scroll resets).
  - (c) Two nested pathless layout routes: `RequireAuth` (renders `<Outlet/>` only when authenticated) containing `AppShell` (renders chrome + `<Outlet/>`), with pages as children (`index` for `/`, `users`).
- **Chosen solution:** (c). Dashboard's `NavLink` uses `end`.
- **Reasoning:** The ordering guarantee comes from the tree structure. The shell cannot mount unless the guard's `<Outlet/>` renders, so it holds with no conditional code in `AppShell`. The shell also persists across `/` ↔ `/users`, and any future authenticated route inherits both guard and chrome just by being a child. `RequireAuth` stays unmodified. Accepted tradeoff: `NotFoundPage` stays outside the shell, so authenticated users hitting an unknown path lose navigation chrome (unchanged from today).

### ADR-5: Mocked datasets behind a three-layer query module — fixtures → fetcher (swap point, Zod-parsed) → hook

- **Problem:** The spec-resolved decision is that mocks go through TanStack Query with a mocked `queryFn`, so a future feature swaps in real endpoints "by changing only the `queryFn`". The design has to make that literally true and safe.
- **Options considered:**
  - (a) Inline `queryFn: () => FIXTURE` inside each component's `useQuery`. This is the fewest files, but query keys get scattered, fixtures leak into component modules, and the swap touches every component.
  - (b) Mock at the HTTP layer (an MSW handler or an Axios adapter) so components call the real `apiClient`. That gives the most realistic swap (delete the mock), but it needs a new dependency (MSW) or a custom adapter, and it needs endpoint paths decided now, which belongs to a future spec.
  - (c) Per dataset: `*.fixtures.js` (domain data only) → `*.api.js` fetcher that returns the fixture and `schema.parse`s it → `*.queries.js` with key factories and hooks. Components import hooks only.
  - (d) Same as (c) without Zod parsing. Less code, but a future endpoint that drifts from the shape the components assume fails as an undefined-property crash deep in render.
- **Chosen solution:** (c). Four dashboard hooks (one per section) and one users hook.
- **Reasoning:**
  - The fetcher body is the single line that changes on swap, and the `apiClient` interceptor already unwraps the envelope, so the swap really is only the `queryFn`.
  - The Zod schema pins the contract the future backend must meet, is testable against fixtures today, and turns contract drift into a handled query error rendered by `QueryState` (CLAUDE.md: Zod for runtime validation).
  - `structuredClone` stops accidental mutation of shared fixtures between tests.
  - Separate hooks per section give independent loading/error states and match a plausible per-widget API.
  - Accepted tradeoffs: about 4 small files per dataset, and a one-frame skeleton on first render even though the mocks resolve immediately. The skeletons are sized to match their cards to avoid layout shift.

### ADR-6: The users list uses a server-shaped query contract (`search`, `page`, `pageSize` in the key), not client-side derivation over the full list

- **Problem:** FR-023/025 require search and pagination over the static dataset with no network round trip. The design must also let a real `/users` endpoint be swapped in with only a `queryFn` change (ADR-5). A real directory of 2,845 users (the design's own number) will be paginated server-side.
- **Options considered:**
  - (a) `useUsers()` returns the whole list, and the page derives filter and slice with `useMemo`. This is simplest, synchronous, and trivially "client-side", but a server-paginated endpoint later changes the hook signature, the query key, and page logic, which breaks the swap promise.
  - (b) `useUsers({ search, page, pageSize })` with params in the query key and `placeholderData: keepPreviousData`. The mock fetcher runs `filterUsers` and `paginate` in-browser and returns `{ items, total, page, pageSize }`.
- **Chosen solution:** (b).
- **Reasoning:** (b) is strictly more swap-friendly. A future paginated endpoint is a one-line fetcher change. Even a future "return everything" endpoint keeps working, because its fetcher can apply `filterUsers`/`paginate` locally. It still meets FR-023/025: the filtering runs in the browser, synchronously resolved, with no network I/O. `keepPreviousData` prevents per-keystroke flicker. Accepted tradeoffs:
  - One cached query per distinct search/page combination (trivial at mock scale; default `gcTime` evicts).
  - Tests must `await` rows via `findBy*`.
  - Debouncing the search input is deferred to the feature that adds the real endpoint (R-5).

### ADR-7: Material Symbols via one Google Fonts stylesheet, `display=block`, rendered through an `<Icon>` component

- **Problem:** The spec resolved "Material Symbols web font, no icon package". What remains open is how it is loaded and how components use it. About 45 distinct icons are needed. The checklist needs the variable `FILL` axis, sizes vary (14–24px), and a ligature icon is plain text ("visibility") to screen readers unless it is hidden.
- **Options considered:**
  - (a) Stitch's two `<link>`s verbatim (a static `opsz/wght/FILL/GRAD@24,400,0,0` plus a variable `wght,FILL@100..700,0..1&display=swap`), and raw `<span className="material-symbols-outlined text-[18px]">` everywhere. This is faithful, but the first link duplicates the second, `display=swap` flashes raw ligature words before the font loads, and every span needs a hand-added `aria-hidden` (easy to forget, and screen readers then announce "alternate_email").
  - (b) One variable link with `display=block`, and a ~15-line `Icon` component: `name`, `size` (inline `fontSize`), `filled` (`fontVariationSettings`), `className`, and `label` (switches from `aria-hidden` to `role="img"`).
  - (c) (b) plus Google's `&icon_names=` subsetting to cut the font payload. That is a large byte saving, but any icon missing from the list renders as text, and the list must be kept sorted and complete by hand.
- **Chosen solution:** (b). (c) is recorded as a later optimisation.
- **Reasoning:** `display=block` is the recommended setting for icon fonts, because a short invisible period beats a flash of words. One component centralises accessibility (icons are decorative by default) and the FILL variation. It also makes a future move to an SVG icon package a one-file change. Size goes through inline style, because Tailwind cannot generate arbitrary `text-[${n}px]` classes from a variable. Accepted tradeoffs:
  - Runtime dependency on the Google Fonts CDN (R-3).
  - The full variable icon font downloads on first visit (cached thereafter).

### ADR-8: No new Redux state; all interactive state is component-local, and checklist toggles are overrides on top of query data

- **Problem:** Several interactions need state: password visibility, the remember checkbox, checklist completion, search/page/pageSize, and sign-out pending. CLAUDE.md puts global client state in Redux and server state in TanStack Query. Checklist items come *from* a query but are toggled locally.
- **Options considered:**
  - (a) A Redux `dashboard`/`users` slice. It survives route changes, but none of this state is global (each piece has exactly one consumer), and it adds actions and selectors for no benefit.
  - (b) Toggle checklist items by writing to the query cache (`setQueryData` or `useMutation`). It looks server-like, but a `refetchOnWindowFocus` refetch returns the fixture's original state and **silently wipes the user's toggles**, which would be a real bug.
  - (c) Component-local `useState` everywhere. For the checklist, an `overrides` map keyed by item id, layered over query data (`overrides[id] ?? item.completed`).
- **Chosen solution:** (c).
- **Reasoning:** Each piece of state has one owner and one consumer, so local state is the simplest correct placement. Overrides survive refetches because they live outside the cache, and when persistence arrives (a future feature, server-side) the toggle becomes a mutation without restructuring the component. Accepted tradeoffs:
  - Checklist toggles reset when the user navigates away from `/` and back. The spec requires only in-memory state and says nothing about navigation (R-7).
  - `uiSlice.sidebarOpen` stays an unused placeholder, since a collapsible sidebar is not in scope.

### ADR-9: Display identity derived client-side from the session email; role from server-controlled `app_metadata`

- **Problem:** FR-012 and FR-015 need a display name, first name, and role label for the signed-in user. `GET /me` returns only `{ id, email }`, and the spec accepted an email-derived fallback with no API change. The role label has no defined source.
- **Options considered:**
  - Name: (i) the raw email local part ("deepti.jakhotra"). Accurate, but reads poorly in "Welcome back, deepti.jakhotra!". (ii) Split the local part on `. _ + -` and title-case it: first word as `firstName`, all words as `fullName` ("Deepti", "Deepti Jakhotra"). This matches the design's first-name/full-name split. (iii) Fetch `/me`. It adds nothing: same data, plus a request.
  - Role: (i) hard-code "Admin" as in Stitch. That tells every user they are an admin, which is misleading. (ii) Supabase `user.role`, which is always `"authenticated"` and meaningless. (iii) `user.user_metadata.role`. **This is user-editable** through `supabase.auth.updateUser`, so the UI would let users label themselves. (iv) `user.app_metadata.role` (writable only with the service-role key) with a `'Member'` fallback.
- **Chosen solution:** Name (ii), role (iv), in a pure `deriveIdentity(user)` exposed through `useIdentity()`.
- **Reasoning:** This is readable, matches the design's two-name usage, needs no network call, and meets the spec's accepted fallback. For role, `app_metadata` is the only session-carried field users cannot write, so whatever it shows is not user-forgeable, even though it is display-only today. Accepted tradeoffs:
  - Some local parts read oddly (e.g. "Jdoe42").
  - Until something populates `app_metadata.role`, everyone sees "Member".
  - A future `/me` extension replaces `deriveIdentity`'s internals only.

### ADR-10: Logout via a `useSignOut` hook that clears the query cache and falls back to local sign-out

- **Problem:** FR-011 requires that Logout calls `supabase.auth.signOut()`, the context turns `unauthenticated`, and `RequireAuth` redirects. Two concerns sit next to that: cached query data outliving the session, and a failed network sign-out leaving the user signed in.
- **Options considered:**
  - (a) An inline `onClick={() => supabase.auth.signOut()}` in `Sidebar`. It is minimal, but cached data (mock today, real user data later) stays in memory for the next person on the machine, and a network failure leaves the user stuck with no feedback.
  - (b) Put the cache-clearing in `AuthProvider` on `SIGNED_OUT`. It is centralised and also covers the 401-triggered sign-out in `apiClient`, but it modifies boilerplate-owned code outside this feature's scope.
  - (c) A `useSignOut()` hook that does `await supabase.auth.signOut()`, falls back to `signOut({ scope: 'local' })` on error, then `queryClient.clear()`, and exposes `isSigningOut` to disable the button.
- **Chosen solution:** (c). (b) is recorded as a follow-up.
- **Reasoning:** It meets FR-011 through the existing redirect path with no change to `AuthProvider`/`RequireAuth`. It stops query data from surviving a session, which matters as soon as the mocks are replaced. The local-scope fallback guarantees the user ends up signed out locally even if the global revoke fails. Accepted tradeoff: the `apiClient` 401 → `signOut()` path does not clear the cache yet (R-9).

### ADR-11: Zero new npm dependencies; fonts from the Google Fonts CDN; Stitch images committed as local assets

- **Problem:** The three designs need three text typefaces, an icon font, a donut chart, relative-time formatting, two logos, and several avatar photos. Each could pull in a package or a remote host.
- **Options considered:**
  - Fonts: (i) `@fontsource/*` packages. Self-hosted, no third-party request, works offline, but 3–4 new dependencies. (ii) The Google Fonts CSS API, exactly as Stitch loads them. No dependency, cached across sites, but a third-party request at runtime.
  - Chart, time, and number formatting: a chart library or date-fns versus inline SVG (spec-resolved) and `Intl`.
  - Images: (i) hot-link Stitch's `lh3.googleusercontent.com/aida-public/…` URLs. Zero effort, but these are unversioned, may expire, and send every page view to a third party. (ii) Initials for every avatar. Robust, but loses the design's photo rows. (iii) Download the 2 logos and at most 7 headshots once into `src/assets/` (resized to ≤96px), import them through Vite, and fall back to initials on load error.
- **Chosen solution:** Fonts (ii); inline SVG and `Intl`; images (iii).
- **Reasoning:** The spec already chose Material Symbols as a web font, which is served by Google Fonts in practice, so self-hosting only the text fonts would still leave the CDN dependency in place for icons. Loading everything the same way Stitch does keeps parity and adds no packages. `Intl` covers "8 minutes ago" and "2,845" natively. Local assets are deterministic and hashed by Vite. If an asset cannot be downloaded at implementation time, the `Avatar` initials path (explicitly allowed by FR-024) covers it. Accepted tradeoffs:
  - Runtime reliance on, and privacy exposure to, Google Fonts (R-3). The migration path is `@fontsource`, with a new ADR if needed.
  - A few KB of binary assets in git.
  - The header avatar shows initials, because the session carries no avatar we trust (ADR-9 reasoning applies to `user_metadata.avatar_url`).

### ADR-12: Post-sign-in redirect is driven only by auth state through a `RedirectIfAuthenticated` guard; no imperative `navigate()` in `LoginPage`

- **Problem:** FR-026 requires redirecting to `/` in two cases: immediately after a successful `signInWithPassword`, and for any already-authenticated visitor who lands on `/login`. FR-005 separately requires the submit logic to stay "exactly as today".
- **Options considered:**
  - (a) An imperative `navigate('/', { replace: true })` in `LoginPage.onSubmit` after a successful call, plus the guard for direct visits. This is explicit at the call site, but:
    - It edits the `onSubmit` body that FR-005 and the plan freeze.
    - It adds a second navigation path for the same outcome, and it races the auth context. `signInWithPassword` resolves, and `navigate` can commit before `AuthProvider`'s `setState` from `SIGNED_IN` has re-rendered. If it does, `RequireAuth` still sees `status: 'unauthenticated'` and bounces back to `/login`, and the guard then redirects to `/` a second time. The result is a visible flicker and an extra history entry at best, and an order-dependent bug at worst.
  - (b) Only the guard: a `RedirectIfAuthenticated` layout route around `/login` that re-renders when `AuthProvider` publishes `authenticated`. The redirect happens only once the session is in context, so `RequireAuth` on `/` is guaranteed to agree.
  - (c) A `useEffect` in `LoginPage` watching `status` and calling `navigate`. It works, but it duplicates the guard's job inside the page, redirects one render late (the login form paints first), and doesn't serve other future guest-only routes.
- **Chosen solution:** (b). `features/auth/RedirectIfAuthenticated.jsx` mirrors `RequireAuth.jsx` (`loading` → `null`, `authenticated` → `<Navigate to="/" replace/>`, otherwise `<Outlet/>`), and `/login` becomes its only child in `router.jsx`.
- **Reasoning:** Both FR-026 cases collapse into one mechanism: "authenticated at `/login`" is the only condition, whether it arose from a submit or a direct visit. There is one source of truth for navigation (the `AuthProvider` status), so the two guards can never disagree, and loops are ruled out by construction (complementary conditions on the same value). `onSubmit` stays byte-for-byte unchanged, which preserves FR-005 literally. The pattern is also symmetric with logout (ADR-10), which likewise never navigates imperatively and relies on `RequireAuth`. This works without timing assumptions because supabase-js notifies `onAuthStateChange` subscribers as part of a successful sign-in. Accepted tradeoffs:
  - Redirect correctness depends on `AuthProvider` receiving `SIGNED_IN`. If a future change broke that subscription, sign-in would appear to do nothing. The integration test uses the real `AuthProvider` with a fake emitter to guard this.
  - After success, Formik's `setSubmitting(false)` runs on an unmounting component. This is harmless (no React 18+ warning, and no state is read afterwards).
  - Redirect always goes to `/`. There is no "return to the page you asked for" (possible follow-up, would change both guards).

## FR traceability

| FR | Plan component(s) |
|---|---|
| FR-001 | `index.css` `@theme` token subset (ADR-1), transcription rules plus guard test (ADR-2), font `<link>`s in `index.html` |
| FR-002 | `LoginBackdrop`, `LoginBrandHeader` (circular logo via true `rounded-full`, "Team BrainX", badge pill, heading, subtext) |
| FR-003 | `AuthTextField` (email, `alternate_email`, `name@company.com`), unchanged `loginSchema`/`toFormikValidate` |
| FR-004 | `LoginPage` `showPassword` state + trailing toggle button in `AuthTextField` |
| FR-005 | Remember checkbox (local state, outside Formik), submit button with `isSubmitting` state, unchanged `onSubmit`, exact-argument test |
| FR-006 | `SsoButtons` (`type="button"`, no handlers, outside `<Form>`) |
| FR-007 | `LoginFooter` |
| FR-008 | `Sidebar`, `navigation.js` (`PRIMARY_NAV`, `FOOTER_NAV`), `SidebarNavItem` |
| FR-009 | `NavLink` active className + `aria-current`, Dashboard `end` (ADR-4) |
| FR-010 | `SidebarNavItem` inert branch (`button`, `aria-disabled`, no handler) |
| FR-011 | `useSignOut` (ADR-10), existing `AuthProvider`/`RequireAuth` redirect |
| FR-012 | `TopHeader`, `HeaderIdentity`, `useIdentity`/`deriveIdentity` (ADR-9) |
| FR-013 | `router.jsx` nested `RequireAuth` › `AppShell` (ADR-4) |
| FR-014 | `router.jsx` index route → `DashboardPage`, delete `HomePage.jsx` |
| FR-015 | `WelcomeBanner` + `useIdentity().firstName` |
| FR-016 | `KpiGrid`, `StatCard`, `TrendPill`, `ProgressBar`, `useDashboardKpis` (ADR-5) |
| FR-017 | `OnboardingChecklist` overrides state, `ChecklistItem`, `ProgressBar` (ADR-8) |
| FR-018 | `ActivityFeed`, `ActivityFeedItem`, `useRecentActivity`, `formatRelativeTime` |
| FR-019 | `QuickNavigation`, `ShortcutTile` (`Link` only for `users`), `quickLinks.js` |
| FR-020 | `RoleBreakdownCard`, `DonutChart`, `computeDonutSegments`, `useRoleBreakdown` |
| FR-021 | `SecurityAdvisoryCard` (static, no hook) |
| FR-022 | `/users` route under `RequireAuth`, `UsersPageHeader`, sidebar + shortcut links |
| FR-023 | `UserSearchInput`, `useUsers` params, `filterUsers` (ADR-6) |
| FR-024 | `UserTable`, `UserRow`, `Avatar`, `RoleBadge`, `StatusBadge` |
| FR-025 | `Pagination`, `getPageItems`, `paginate`, 24-user fixture (ADR-6) |
| FR-026 | `RedirectIfAuthenticated` layout route around `/login` in `router.jsx`, existing `AuthProvider` `SIGNED_IN` propagation, unchanged `LoginPage.onSubmit` (ADR-12) |

## Open items for Architecture Review Board — resolved 2026-09-23

- **OI-1: Authenticated user on `/login` is never redirected.** **Resolved:** the owner added FR-026 to the spec. It is designed in Routing, "Data flow: sign-in redirect", and ADR-12.
- **OI-2: Sidebar brand copy.** **Resolved:** follow Stitch exactly as designed. The sidebar shows "Nexus Enterprise" and the Stitch sidebar logo, and the login shows "Team BrainX", each through a `BRAND_LABEL` constant, so a later change is one line.

## Risks

| # | Risk | Mitigation |
|---|---|---|
| R-1 | Silent visual drift: v4 emits no CSS for unknown or legacy classes copied from Stitch (e.g. `font-body-md`, `flex-shrink-0`, bare `rounded`), so mistakes produce no error. | ADR-2 rule table, `tailwindLegacyClasses.test.js` in `pnpm test`, manual side-by-side at 1440px, and `shadow-sm`/`rounded-sm` on the review checklist. |
| R-2 | Overriding `--radius-lg`/`--radius-xl` surprises future developers who expect Tailwind defaults. | Comment in `index.css` naming the Stitch source. No existing markup depends on the defaults. Constitution/ADR-1 records it. |
| R-3 | Google Fonts CDN: offline dev shows fallback fonts and ligature words, EU privacy exposure (IP sent to Google), and a future CSP must allow two origins. | System-font fallbacks in every `--font-*` stack. `display=block` for icons. Self-hosting via `@fontsource` is the documented escape hatch (ADR-11), but it needs an ADR. A CSP task later must add `fonts.googleapis.com` (style) and `fonts.gstatic.com` (font). |
| R-4 | Screen readers announce icon ligature names ("alternate_email", "chevron_left"). | `Icon` defaults to `aria-hidden="true"`. Icon-only buttons (password toggle, bell, pagination arrows) carry an `aria-label`. |
| R-5 | The future real `/users` endpoint gets one request per keystroke. | Out of scope now (the mock is instant). The swap feature adds debouncing inside `useUsers` (hook-internal, so components are unchanged). Noted in ADR-6. |
| R-6 | The Dashboard `NavLink` without `end` stays active on every route, breaking FR-009. | `end: true` in `navigation.js`, plus a test asserting only one `aria-current="page"` on `/users`. |
| R-7 | Checklist toggles reset on route change, which users may perceive as a bug. | Accepted (spec: in-memory only). If ARB wants persistence across navigation, move `overrides` to a small Redux slice. That is client UI state, so it complies with CLAUDE.md. |
| R-8 | The spec's "visually match" requirements have no automated check. | Manual parity checklist per screen in tasks.md. Visual regression tooling would need a new dependency and ADR (out of scope). |
| R-9 | The `apiClient` 401 → `signOut()` path doesn't clear the query cache, so data from the old session could persist. | Irrelevant while data is mocked. Follow-up (ADR-10 option b) to centralise in `AuthProvider`, tracked in notes.md. |
| R-10 | Stitch image URLs expire before implementation, so the local assets can't be fetched. | `Avatar` initials fallback (allowed by FR-024), and the logo falls back to an `Icon` in the same circular frame. The fixture sets `avatarUrl: null` for any missing asset. |
| R-11 | Default-palette colours used by Stitch (`emerald-*`, `amber-*`) are OKLCH in v4 versus hex in v3, a slight hue difference from the reference render. | Accepted (imperceptible at badge sizes). If the parity review flags it, add those few hexes as explicit tokens. |
| R-12 | The fixed 256px sidebar overlaps content on narrow viewports. | Accepted by the spec (desktop parity only). Stitch's responsive classes are kept so a future responsive pass has a base. |
| R-13 | Async query resolution makes component tests flaky. | A fresh `QueryClient` per test with `retry: false`, `findBy*` queries, and fixtures that resolve immediately (no timers). |
| R-14 | A developer puts the remember checkbox in Formik, which silently changes the `signInWithPassword` payload. | Stated explicitly in "Login restyle constraints". The exact-argument test fails if the payload changes. |
| R-15 | Formatted "relative time" in fixtures drifts if fixtures use fixed dates. | `occurredAt` is computed relative to `Date.now()` at module load, and `formatRelativeTime(date, now)` takes an injectable `now` for tests. |
| R-16 | A redirect loop or bounce between `/login` and `/`, if someone later adds an imperative `navigate()` to `LoginPage` or makes the two guards read different state. | ADR-12 forbids imperative navigation on sign-in. Both guards read the same `useAuth().status` with complementary conditions. The no-loop test and the real-`AuthProvider` post-sign-in test run in `pnpm test`. |
| R-17 | A sign-in that succeeds but emits no `SIGNED_IN` event (e.g. a broken `AuthProvider` subscription) leaves the user on `/login` with no feedback. | The integration test exercises the real `AuthProvider` subscription path. `AuthProvider` itself is unchanged in this feature. |
