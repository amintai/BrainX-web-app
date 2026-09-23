---
feature: auth-dashboard-ui
---

# Notes: Auth Dashboard UI

Append-only log of decisions, deviations from the plan, and tradeoffs made during implementation. Do not edit or delete earlier entries — add new dated entries below.

## 2026-09-23 — Plan drafted (Architect agent), status: in-review

### Findings while planning

- **Tailwind version mismatch.** The Stitch exports target the Tailwind **v3** Play CDN with a JS config. The app runs **v4.3.3** with CSS-first `@theme`. Several classes changed meaning or no longer exist (`shadow-sm` is now `shadow-xs`, bare `rounded`/`rounded-sm` are now `rounded-xs`, `flex-shrink-0` is now `shrink-0`, `outline-none` is now `outline-hidden`). v4 silently emits nothing for unknown classes. This is handled by the ADR-2 rule table plus a guard test. Source: https://tailwindcss.com/docs/border-radius, https://tailwindcss.com/docs/theme
- **Stitch radius overrides.** Stitch sets `DEFAULT 0.125rem, lg 0.25rem, xl 0.5rem, full 0.75rem`. Keeping `full: 0.75rem` would make the 40px login logo a squircle, which contradicts FR-002's "circular logo". The plan overrides only `lg`/`xl`. v4's `rounded-full` is a static `calc(infinity * 1px)`, not a theme variable.
- **Stitch donut SVG uses lowercase `viewbox`.** React/SVG requires `viewBox`. Recorded in the transcription table.
- **The login payload is `values` verbatim.** `LoginPage` calls `supabase.auth.signInWithPassword(values)`. Putting the new remember-device checkbox in Formik would silently change that payload and break FR-005's "exactly as today". The plan keeps it in local `useState` and adds an exact-argument test.
- **Existing gap (OI-1).** `LoginPage` never navigates after a successful sign-in, and nothing redirects an authenticated visitor away from `/login`. The spec is silent on this. Recommend the PM add FR-026 before tasks. The plan does not build it by default (spec first).
- **Brand copy ambiguity (OI-2).** The login says "Team BrainX", but the dashboard and users Stitch sidebars say "Nexus Enterprise" with a different logo. The default follows the Stitch copy through one `BRAND_LABEL` constant, flagged for the owner.
- **Role label source.** `user.user_metadata` is user-editable via `supabase.auth.updateUser`, so it must never supply a role label. The plan uses `app_metadata.role` (service-role-only) with a `'Member'` fallback (ADR-9).
- **Remote Stitch images** (`lh3.googleusercontent.com/aida-public/…`) are unversioned and may expire. The plan commits local copies and uses an initials fallback (ADR-11).
- **Minor interpretation:** the Stitch "Rows per page" select is made functional (pageSize state, resets to page 1). FR-025 does not require it, but a visible, inert native select is a UX defect, and with ADR-6 it costs almost nothing. Flagged here per "no silent divergence".
- **No new npm dependencies** and no backend, env, or migration changes (ADR-11, constitution check).

### Sparring partner review

**Step 1 — Attack**

1. **ADR-6 over-engineers the users list.** The spec says "filters the static dataset client-side". A `useMemo` over the full list is five lines. Putting search and page in the query key creates a cache entry per keystroke, forces async tests, and invents a server contract no one has specified.
2. **ADR-5's Zod schemas for mock data are ceremony.** Validating a fixture you wrote yourself proves nothing, and there is no backend to drift.
3. **Collapsing 12 font aliases (ADR-1) forces a translation of almost every Stitch element.** Every `font-body-md` must be deleted and every `font-headline-*` rewritten, and v4 will not complain when someone forgets. Keeping the aliases would allow true copy-paste.
4. **Overriding `--radius-lg`/`--radius-xl` is a trap.** Every future developer and every Tailwind snippet from the internet will be wrong by a factor of two.
5. **Google Fonts at runtime.** The page depends on a third party for its icons, so offline dev renders words instead of glyphs. There are EU privacy concerns, and a future CSP must carve out two origins. Self-host.
6. **Four dashboard queries means four skeleton flashes and four future requests** where one aggregate endpoint would do.
7. **Checklist state resetting on navigation will be filed as a bug** on day one.
8. **Committing AI-generated headshots to git** adds binary bloat and unclear provenance for placeholder data.
9. **The plan punts on two real spec gaps (OI-1, OI-2).** A dashboard you cannot reach after login without typing a URL is broken.
10. **"Visually match" is the heart of this spec and has no automated check.**

**Step 2 — Steelman**

1. The swap-by-`queryFn` promise is the spec owner's explicit resolved decision. With whole-list derivation, the most likely real endpoint (server-paginated, since the design itself says 2,845 users) would break that promise. The mock still filters in the browser without network I/O, so FR-023/025 hold. `keepPreviousData` removes flicker, and the cache entries are tiny and garbage-collected.
2. The schema's value is not validating today's fixture. It is the executable contract the future endpoint must satisfy, living at the exact line that will change. It also turns drift into a rendered error state rather than a crash, and CLAUDE.md names Zod for runtime validation.
3. The translation is mechanical and short, three rules in total. Twelve font names for three typefaces is exactly the redundancy that produces inconsistency (`font-label-md` vs `font-body-md` for identical output). The guard test catches the silent-failure mode.
4. The overridden names are the two most frequent radius classes in the markup, so overriding them keeps most classes copy-verbatim. Nothing existing depends on the defaults, and a comment documents the override.
5. The spec owner already chose the Material Symbols web font. Self-hosting only the text fonts would still leave the icon CDN dependency. Parity with Stitch's own loading, zero new packages, and a documented `@fontsource` escape hatch is the proportionate choice for a hackathon workspace.
6. Mocks resolve in a microtask, so the flash is a single frame. Skeletons are sized to their cards (no layout shift). Per-section queries let sections fail independently, and one aggregate endpoint can later sit behind four `select`s without touching components.
7. The spec explicitly scopes checklist state to in-memory client state. The overrides design survives refetches (the actual bug risk, which cache mutation would have hit), and moving it to Redux is a contained change if ARB wants it.
8. There are at most 9 images, each resized to ≤96px, and the initials fallback is permitted by FR-024 if they are dropped entirely.
9. The Architect cannot add requirements. The living-spec process says fix the spec first. Both items carry a stated default and a one-line or one-FR remedy.
10. Automated visual regression would need a new dependency and CI infrastructure, which is out of scope. The guard test covers the most likely systematic cause of drift.

**Step 3 — Honest verdict**

The plan holds up. The single biggest risk is **silent visual drift from v3 → v4 transcription** (R-1). The spec's core promise is visual parity with Stitch, and v4 turns every mis-transcribed class into invisible nothing rather than an error. The second biggest is **OI-1**: without a post-login redirect, the demo flow login → dashboard is broken in practice, even though every FR passes.

Changes made to the plan as a result:

- **Added** `tailwindLegacyClasses.test.js` (a guard for Stitch/v3-only tokens) to the test strategy and constitution check. Put `shadow-sm` → `shadow-xs` and `rounded-sm` → `rounded-xs` on the review checklist, because those are valid v4 classes that the guard cannot ban (ADR-2, R-1).
- **Added** the ChecklistItem event design (single toggle point on the row, inner `aria-pressed` button without a handler, and `stopPropagation` on the inert action button). This came from attack 7's follow-up review of how toggling actually works. It prevents both double-toggles and cache-refetch wipes (ADR-8).
- **Escalated** OI-1 as a recommended FR-026 spec amendment rather than a silent addition.
- **Kept** ADR-5 (Zod), ADR-6 (server-shaped users), the font collapse, and the radius overrides. Each attack is real, but each has a mitigation or a one-file escape hatch.

**Action for the PM agent / owner before Phase 3:** decide OI-1 (add FR-026?) and OI-2 (sidebar brand copy). Neither blocks the plan, but OI-1 affects the task list if it is accepted.

Next step: Architecture Review Board sign-off. The Architect must not set `status: approved`.

## 2026-09-23 — Plan updated for FR-026 (Architect agent), status: in-review

- OI-1 resolved: the owner added FR-026. OI-2 resolved: follow the Stitch brand copy per screen (the plan default stands, no change).
- Added the `features/auth/RedirectIfAuthenticated.jsx` guard, which mirrors `RequireAuth` with inverted conditions. `/login` is now its child in `router.jsx`. Also added a sign-in redirect data flow, FR-026 tests, a constitution line, traceability, R-16/R-17, and **ADR-12**.
- **Decision:** there is no imperative `navigate()` in `LoginPage`. The guard's re-render on `AuthProvider`'s `SIGNED_IN` is the only redirect mechanism. The reasons:
  - It keeps `onSubmit` byte-for-byte unchanged (FR-005).
  - It avoids a race where `navigate('/')` commits before the auth context updates, which would make `RequireAuth` bounce back to `/login`.
  - It handles both FR-026 cases with one mechanism, and it matches the logout design (ADR-10).
- Short sparring check on the change. **Attack:** "relying on an event is implicit, and a broken subscription makes sign-in look like it did nothing." **Steelman:** the event is the same one `RequireAuth` and the whole app already depend on, and the imperative alternative introduces a real ordering bug. **Verdict:** keep the guard-only design, and guard it with an integration test that uses the real `AuthProvider` and a fake Supabase emitter (R-17).

## 2026-09-23 — Tasks drafted (Planner agent), status: draft

- `tasks.md` written against the approved plan (constitution check fully ticked, confirmed before writing). 54 tasks, `T001`–`T054`, execution-strategy: Dependency Order, with the Dashboard vertical (`T028`–`T041`) and Users vertical (`T042`–`T049`) explicitly callable in parallel by two developers once Phases A–D (foundation, primitives, auth extensions, shell) land — the plan's own file tree shows these two feature folders share no files.
- Grouped tasks around the plan's own file/contract boundaries rather than one-task-per-file, mirroring `specs/boilerplate-setup/tasks.md`'s convention (e.g. `RoleBadge.jsx` + `StatusBadge.jsx` in one task, `dashboard.fixtures.js` + `dashboard.schemas.js` in one task) — each grouping is still closeable in a single PR.
- Flagged three tasks as needing extra care during implementation and review, per the plan's own risk register:
  - `T004`/`T052` — the Tailwind v3→v4 legacy-class guard test and its full-tree closeout run (ADR-2, R-1 — the plan's stated single biggest risk: v4 silently emits no CSS for an unrecognized class, so a bad transcription produces no build error).
  - `T016` — `RedirectIfAuthenticated.jsx` must be the byte-for-byte inverse of `RequireAuth.jsx`'s condition table (R-16).
  - `T051` — the FR-026 integration suite must use the real `AuthProvider` with a fake Supabase auth-state emitter, not a shallow mock, since R-17 is specifically about the subscription wiring silently breaking.
- No deviations from `plan.md` made during task-writing. No implementation code was written.

## 2026-09-23 — Implementation started (Developer agent)

- **T003 deviation:** did not commit local `apps/web/src/assets/brand/` or `apps/web/src/assets/mock-avatars/` image files. The Stitch remote image URLs are still live (verified one returns HTTP 200), so this is not R-10 (expired URLs) — it is that this environment has no image-processing tool available (no ImageMagick/`sharp`/Python-PIL) to resize the source photos to the required ≤96px-longest-edge constraint before committing them to git. Downloading and committing full-size (multi-hundred-KB) images would violate the plan's explicit sizing requirement, so per T003's own care flag ("ship with the Avatar initials fallback ... don't block on it") all fixtures use `avatarUrl: null` for these three named users (Marcus Vance, Elena Rostova, Chloe Chen) and any activity-feed user actors, relying on `Avatar`'s initials fallback (permitted by FR-024) and an `Icon`-based fallback in place of the two logo images. If a future session has image-processing tooling available, this can be revisited without any other code change (the fixtures already model `avatarUrl: string|null`).
- **Infra fix (not a task, but required for the test suite to pass):** `apps/web/src/test/setup.js` had no `afterEach(cleanup)` for React Testing Library, and the project's Vitest config does not set `globals: true`, so RTL's auto-cleanup detection never engaged. Without this, any test file with more than one `render()` call leaked DOM nodes across tests (`getByText` started throwing "multiple elements found"). Added `afterEach(() => cleanup())` to `test/setup.js`. This is outside the plan's file tree (`test/setup.js` wasn't listed as changed) but is a one-line, test-infrastructure-only fix with no product-code impact, required before any of T008 onward's multi-test component files could pass reliably.
- **`apps/web/src/features/auth/RequireAuth.test.jsx` updated (not a new task):** its existing "LoginPage validation" test asserted on the old placeholder markup (`getByLabelText('Email')`, button name `/log in/i`). T021 restyled `LoginPage` per the Stitch design (label "Work Email", submit button "Enter BrainX Workspace") exactly as the plan and tasks direct, so this pre-existing test's selectors were updated to match the new copy while preserving its original intent (invalid email still shows the Zod error, `signInWithPassword` still not called). No assertion was weakened.
- **`apps/web/src/features/users/UserManagementPage.jsx` deviates slightly from a literal reading of the plan's component-contract table:** the search ribbon and table containers use raw `div`s with the exact Stitch classes instead of the shared `Card` component, because `Card`'s hard-coded `p-space-lg` base class cannot be reliably overridden by a later `className` (Tailwind's generated stylesheet order — not JSX attribute order — decides which utility wins, so appending `p-0` after `p-space-lg` is not guaranteed to win). Using `Card` here would have left unwanted padding around the table that Stitch's own markup does not have. This is a presentation-only substitution; `Card` is still used as designed everywhere in the dashboard vertical.

## 2026-09-23 — T052 legacy-class guard closeout review

- `pnpm --filter web test tailwindLegacyClasses` exits 0 against the full `src/` tree (55 test files navigate through it as part of the whole-suite run; the guard's own file, `src/test/tailwindLegacyClasses.test.js`, passes standalone too).
- `grep -rn "shadow-sm\|rounded-sm" apps/web/src` was reviewed line-by-line: the only matches are inside `src/test/tailwindLegacyClasses.js`/`.test.js` themselves (the banned-token literals and their own unit tests), not real usage. No production `.jsx` file contains an un-transcribed `shadow-sm` or `rounded-sm` — every Stitch `shadow-sm` was written as `shadow-xs`, and every Stitch bare `rounded`/`rounded-sm` was written as `rounded-xs`, per the ADR-2 rule table.

## 2026-09-23 — T053 visual parity: scope limitation, done as a structural review only

- This environment has no browser/screenshot/headless-rendering tool available (no Playwright/Puppeteer in `node_modules`, and adding one would violate ADR-11's "zero new dependencies"). A literal 1440px-viewport side-by-side pixel comparison against the three Stitch HTML exports, as the task's `Verify:` line describes, could not be performed.
- What was done instead, as a partial substitute: every component in `features/auth/components/`, `features/shell/`, `features/dashboard/components/`, and `features/users/components/` was written by transcribing the corresponding Stitch markup block directly (copy, DOM structure, class lists) against the three reference HTML files in the scratchpad, applying only the ADR-2 rule-table substitutions. A manual re-read of each component's JSX against its source Stitch block confirms structural/copy parity (headings, copy text, section order, badge/status color assignments, icon names). What this review cannot confirm is actual rendered pixel layout, font-loading behavior, or hover/focus visual states in a real browser.
- Logged as a known gap rather than silently marked complete. Recommend a follow-up manual QA pass (or a Playwright/Percy-based visual regression task, which per the plan's own R-8 would need a new ADR) once this can run in an environment with a real browser.

## 2026-09-23 — T054 validation run

- `pnpm --filter web test`: 55 test files, 135 tests, 0 failed, 0 skipped.
- `pnpm --filter web lint`: 0 errors, 1 pre-existing warning in `AuthProvider.jsx` (a file this feature does not modify, per the plan's explicit "not modified" list).
- `pnpm --filter web format:check`: clean (ran `prettier --write` once during implementation to normalize a batch of newly-added files, then re-verified `format:check` exits 0).
- `pnpm --filter web build`: succeeds (409 modules, ~217KB gzipped JS — a pre-existing chunk-size warning, not introduced by this feature).
- The manual "preview + click through login → dashboard → users → logout → back-to-login" pass could not be performed interactively (no browser in this environment, same limitation as T053). Substituted with: (a) `pnpm --filter web preview` confirmed to serve the built `index.html` shell correctly (fonts/assets wired) via `curl`, and (b) the automated `redirect.integration.test.jsx` suite (T051), which already exercises the full login → SIGNED_IN → dashboard → SIGNED_OUT → back-to-login state machine end-to-end against the real `AuthProvider` and the real route tree — the strongest available substitute for a manual click-through in a non-interactive environment.
