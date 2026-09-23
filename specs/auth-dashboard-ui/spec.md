---
feature: auth-dashboard-ui
status: approved   # draft -> in-review -> approved
owner: deepti.jakhotra
created: 2026-09-23
approved-by: deepti.jakhotra
approved-date: 2026-09-23
---

# Spec: Auth Dashboard UI

> Do not mix "what the system must do" with "how it will be built." Tech stack and implementation choices belong in `plan.md`.

## Context

The boilerplate-setup feature wired Supabase Auth end-to-end but left the login screen unstyled and the authenticated area as a single placeholder page with no navigation shell. Three Stitch-generated designs (login, welcome/dashboard, user management) define the intended visual and component layer for this workspace, and the app currently has no shared authenticated layout (sidebar/header) for any future authenticated route to build on. This feature closes that gap: it restyles the existing functional login flow, introduces a shared `AppShell` navigation layout, and builds two new authenticated pages (dashboard, user management) against static data so subsequent features can wire real endpoints without redoing the UI layer.

## Technical requirements

- The frontend Tailwind configuration (`apps/web/src/index.css`) must expose the Stitch design tokens (brand colors, semantic surface/on-surface colors, `Plus Jakarta Sans` / `Inter` / `JetBrains Mono` font families, the Stitch type scale, and the spacing/radius scale) so components can reference them as Tailwind utility classes instead of inline arbitrary values.
- `apps/web/src/features/auth/LoginPage.jsx` must be restyled to match the Stitch "Login - Nexus Workspace" design while preserving its existing Formik form state, `loginSchema` (Zod) validation, and `supabase.auth.signInWithPassword` submission logic unchanged.
- A shared `AppShell` (or `Layout`) component must render the fixed left sidebar and fixed top header from the Stitch designs and must wrap every authenticated route, replacing the current bare pass-through `RequireAuth` layout route in `apps/web/src/app/router.jsx`.
- The sidebar's active navigation item must reflect the current route; only `Dashboard` and `User Management` are wired to real routes in this feature.
- The current placeholder `apps/web/src/pages/HomePage.jsx` must be replaced by a dashboard page matching the Stitch "Welcome & Dashboard Overview" design, using static/mock data — no new backend endpoints are introduced by this feature.
- A new user-management listing page must be added matching the Stitch "User Management" design, using a static/mock in-memory dataset — no `/api/v1/users` backend endpoint exists yet.
- All new interactive elements (password visibility toggle, onboarding checklist, user-management search and pagination) must be operable client-side against static data without a network round trip.
- Iconography, layout proportions, copy, and component states (hover, active, disabled) must visually match the reference Stitch HTML/Tailwind markup for each of the three screens.

## Acceptance criteria

- [ ] **FR-001:** Stitch design tokens are available as Tailwind theme values
      Given `apps/web/src/index.css` currently contains only `@import 'tailwindcss';` with no custom theme
      When the design token set captured from the Stitch project (brand/semantic colors, `Plus Jakarta Sans`/`Inter`/`JetBrains Mono` font families, the Stitch font-size scale, and the spacing/radius scale) is added to the Tailwind theme
      Then a component using a token-based class (e.g. a color or font-family utility corresponding to a Stitch token) renders with the exact value from the Stitch token set, verifiable by inspecting the computed style in a built page.

- [ ] **FR-002:** Login card layout and brand header match the Stitch design
      Given an unauthenticated user navigates to `/login`
      When the page renders
      Then a centered card is shown with two blurred gradient decoration elements behind it, a circular logo image, the brand label "Team BrainX", a rounded badge pill above the heading, the heading "Welcome back", and the subtext "Sign in to access your hackathon workspace & projects" — all positioned as in the Stitch login markup.

- [ ] **FR-003:** Email field renders with icon and unchanged validation
      Given the restyled login form
      When the email input is rendered
      Then it displays a leading email icon inside the field and the placeholder `name@company.com`, and submitting an invalid email still produces the existing `loginSchema` Zod error message beneath the field without any change to validation logic.

- [ ] **FR-004:** Password field renders with a working show/hide toggle
      Given the restyled login form
      When the user clicks the visibility-toggle icon inside the password field
      Then the input's type switches between `password` and `text` and the icon swaps accordingly, and the existing `loginSchema` minimum-length validation still fires unchanged when the field is invalid.

- [ ] **FR-005:** Remember-device checkbox and submit button match the design and preserve submission logic
      Given the restyled login form
      When the form is rendered
      Then a "Remember this device for 30 days" checkbox is present below the password field, and a full-width primary submit button reading "Enter BrainX Workspace" with a trailing arrow icon is present that, on click with valid credentials, still calls `supabase.auth.signInWithPassword` exactly as today and shows a disabled/submitting state while the call is in flight.

- [ ] **FR-006:** SSO section renders as decorative, non-functional buttons
      Given the restyled login form
      When the "Or continue with" divider and the two SSO buttons ("Google SSO", "Microsoft") are rendered
      Then both buttons are present with their respective icons but clicking either button does not perform any authentication request or navigation (no OAuth call is wired).

- [ ] **FR-007:** Login footer renders links and security badge line
      Given the restyled login page
      When the footer area below the card is rendered
      Then it shows three links ("Terms of Service", "Privacy Policy", "Enterprise Support") separated by bullet characters, and a line of static text reading "Encrypted via TLS 1.3 & SOC2 Type II Certified" beneath them.

- [ ] **FR-008:** AppShell sidebar renders brand, nav items, and pinned footer items
      Given an authenticated user views any route wrapped by `AppShell`
      When the sidebar renders
      Then it shows the logo and brand label at the top, followed by four nav items in order (`Dashboard`, `User Management`, `Analytics`, `Settings`) each with an icon and label, and `Support` and `Logout` pinned at the bottom of the sidebar in their own group.

- [ ] **FR-009:** Active sidebar item reflects the current route
      Given an authenticated user is on `/` (dashboard) or `/users` (user management)
      When the sidebar renders
      Then the nav item corresponding to the current route has the active visual treatment (highlighted background/text) and no other nav item does; navigating between the two routes moves the active state accordingly.

- [ ] **FR-010:** Analytics and Settings nav items are inert
      Given an authenticated user views the sidebar
      When the user clicks the `Analytics` or `Settings` nav item
      Then no route change occurs and no placeholder page is rendered — the click has no navigation effect.

- [ ] **FR-011:** Logout nav item signs the user out
      Given an authenticated user views the sidebar
      When the user clicks the `Logout` item
      Then `supabase.auth.signOut()` is invoked, the auth context transitions to `unauthenticated`, and the user is redirected to `/login` by the existing `RequireAuth` guard.

- [ ] **FR-012:** Top header renders search bar, notification bell, and user identity block
      Given an authenticated user views any route wrapped by `AppShell`
      When the header renders
      Then it shows a search input with placeholder text and a search icon, a notification bell icon with an unread-indicator dot, and — reflecting the currently authenticated user from `useAuth()` — an avatar, a display name, a role label, and a dropdown chevron; none of the search input, bell, or chevron perform any network request or open a menu.

- [ ] **FR-013:** AppShell wraps every authenticated route
      Given the router configuration in `apps/web/src/app/router.jsx`
      When an authenticated user navigates to `/` or `/users`
      Then the rendered tree includes the `AppShell` sidebar and header around the page content, and an unauthenticated user hitting either route is still redirected to `/login` by `RequireAuth` before `AppShell` renders.

- [ ] **FR-014:** Dashboard page replaces the HomePage placeholder at `/`
      Given the router's `/` route
      When an authenticated user navigates to it
      Then the new dashboard page renders in place of the previous placeholder `HomePage` content ("BrainX boilerplate is running.").

- [ ] **FR-015:** Welcome banner is personalized from the authenticated session
      Given an authenticated user with a session from `useAuth()`
      When the dashboard's welcome banner renders
      Then it displays "Welcome back, {name}!" where `{name}` is derived from the authenticated user's identity (e.g. the local part of their email, since the backend does not currently expose a display name), alongside the static environment badge and subtext text from the Stitch design.

- [ ] **FR-016:** Four KPI stat cards render with static data
      Given the dashboard page
      When the KPI section renders
      Then exactly four cards are shown in a row (`Total Active Users`, `Workspace Licenses`, `System Health & Security`, `Pending Access`), each populated from a static/mock data source and each showing the trend/status element from the Stitch design (percentage change, progress bar, "all systems nominal" indicator, or "requires review" tag, respectively).

- [ ] **FR-017:** Onboarding checklist is interactive and its progress bar reflects state
      Given the dashboard's "Quick Onboarding & Next Steps" section with its four static checklist items (two initially complete, two initially incomplete)
      When the user clicks an incomplete item
      Then that item's icon and text switch to the completed visual state, the "N of 4 done" counter and the progress bar both update to match the new completed count, and clicking a completed item reverses the change.

- [ ] **FR-018:** Recent activity feed renders static entries
      Given the dashboard page
      When the "Recent Organization Activity" section renders
      Then it shows the static/mock list of activity entries in order, each with an actor/icon, a description, a relative timestamp, and a category tag, matching the structure of the Stitch markup.

- [ ] **FR-019:** Quick-navigation shortcut tiles render, only User Management is functional
      Given the dashboard's "Quick Navigation" section with its four shortcut tiles (`User Management`, `Security Settings`, `API Keys & Tokens`, `Team Permissions`)
      When the user clicks the `User Management` tile
      Then the app navigates to `/users`; when the user clicks any of the other three tiles, no route change occurs.

- [ ] **FR-020:** Users-by-role donut chart renders static breakdown data
      Given the dashboard's "Users by Role" section
      When it renders
      Then a donut visualization shows three segments (Admins, Editors, Viewers) sized to the static mock percentages, and a legend lists each role with its static count and percentage matching the chart segments.

- [ ] **FR-021:** Security-advisory banner renders static content
      Given the dashboard page
      When the right-column "Enterprise Security Guarantee" section renders
      Then it displays the static advisory heading and body text in a visually distinct (non-white) card, with no data fetched from any backend.

- [ ] **FR-022:** User Management page is reachable and shows breadcrumb/title
      Given an authenticated user
      When they navigate to `/users` (via the sidebar nav item or the dashboard's `User Management` shortcut tile)
      Then the page renders a breadcrumb ("Organization / Access Control"), the page title "User Management", and the description text beneath it, and an unauthenticated visitor to `/users` is redirected to `/login`.

- [ ] **FR-023:** User search input filters the static dataset client-side
      Given the User Management page's static/mock user dataset
      When the user types a substring into the search input
      Then only rows whose name or email contains the typed substring (case-insensitive) remain visible in the table, and clearing the input restores all rows.

- [ ] **FR-024:** User table renders User/Role/Status columns with hover state
      Given the static/mock user dataset
      When the table renders
      Then each row shows an avatar (or initials fallback) with name and email stacked in the User column, a role badge in the Role column, and a colored status badge (`Active`, `Pending`, or `Inactive`, each with its own badge color per the Stitch design) in the Status column, and hovering a row applies the hover background treatment from the design.

- [ ] **FR-025:** Pagination controls operate over the static dataset
      Given a static/mock user dataset seeded with enough rows to span more than one page at the configured page size
      When the user clicks a page number or the next/previous control
      Then the table displays the rows belonging to that page, the current page control shows the active-page treatment, the previous control is disabled on the first page, and the "Showing X-Y of Z users" summary text updates to match the visible range.

## Out of scope

- Real Google/Microsoft OAuth wiring for the login page's SSO buttons — they are decorative only in this feature.
- A functional "forgot password" reset flow — the link renders per the Stitch design but does not need to route to a working reset page.
- Persisting the "remember this device" checkbox to storage or extending session lifetime based on it — the checkbox is visual/state-only in this feature.
- The top header's search bar — it is decorative only; it does not filter or search anything, and is distinct from the User Management page's search input (FR-023), which is functional over the static dataset.
- Real notification data or a notification panel/menu behind the bell icon.
- A real `/api/v1/users` backend endpoint, or any backend endpoint for dashboard KPIs, activity feed, or role-breakdown data — this feature is UI/component and navigation layer only, built against static/mock data; wiring real endpoints is a future feature.
- Persisting onboarding-checklist completion state server-side or across page reloads — it is in-memory, client-side state for this feature.
- `Analytics` and `Settings` pages/routes — the sidebar items exist visually but remain inert; no page is built for either in this feature.
- User-management row-level actions (edit, deactivate, invite, bulk actions) beyond what the Stitch export shows — no such controls exist in the reference design markup, so none are added.
- Dark mode theme or a dark-mode toggle — the Stitch Tailwind config declares `darkMode: "class"` but defines no dark-mode values and no toggle appears in any of the three designs.
- Pixel-perfect mobile/responsive visual QA — the Tailwind responsive classes present in the Stitch export are preserved, but only desktop-width layout parity is required for acceptance in this feature.
- Real-time updates (polling, websockets) to any dashboard metric, activity feed entry, or user list row.

## Open questions

All resolved by owner (deepti.jakhotra) 2026-09-23:

- **Display name/role source:** accept the email-derived fallback (FR-015/FR-012 as written). No `/api/v1/me` contract change in this feature; a future feature can add `name`/`role` if a real need arises.
- **Icon approach:** Material Symbols web-font, consistent with the Stitch export — no new icon-package dependency.
- **Donut chart (FR-020):** inline SVG, matching the Stitch export — no new charting dependency, no ADR required.
- **Mock data wiring:** static/mock datasets are served through TanStack Query with a mocked `queryFn` (per CLAUDE.md's server-state convention), so a future feature can swap in real endpoints by changing only the `queryFn`.
- **Color palette scope (FR-001):** import only the subset of Stitch design tokens actually referenced by these three screens, not the full ~40-token palette — extend later if a future screen needs more.
