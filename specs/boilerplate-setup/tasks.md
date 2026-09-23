---
feature: boilerplate-setup
status: approved
owner: deepti.jakhotra
created: 2026-09-23
approved-by: deepti.jakhotra
approved-date: 2026-09-23
execution-strategy: Dependency Order
---

# Tasks: Boilerplate Setup

> `plan.md` status is `approved` (approved-by AminTaiTntra, 2026-09-22... plan approved 2026-09-23) and the constitution check is fully ticked — confirmed before writing this file. Each task closes in a single PR and states a concrete verify step.

Task ID format: `T001`, `T002`, … — used for traceability back to `FR-NNN` requirements.
`[P]` marks tasks that can run in parallel with other `[P]` tasks at the same dependency level (no shared files, no ordering constraint between them).
`Satisfies: FR-NNN` links each task to the acceptance criterion(s) it implements. Several tasks jointly satisfy one FR when the plan splits an FR's evidence across a config task and a later end-to-end validation task (e.g. FR-001, FR-021, FR-022) — this mirrors the FR-traceability table in `plan.md`.

## Execution strategy: Dependency Order

This feature has no independent user stories to sequence by priority (P1/P2/P3) — it is a single cohesive scaffold where almost every later piece needs an earlier piece to exist (you cannot wire `requireAuth` before `config/env.js` exists; you cannot write `app.js` before its middleware files exist). **MVP First** and **Incremental delivery** don't map cleanly onto "build one repo skeleton"; **Dependency Order** is the honest description of what's happening: foundations first (cleanup → root config → workspace scaffolds), then the two apps built bottom-up from their leaf modules to their entry points, then cross-cutting validation tasks that only make sense once everything else exists (full clean install, root `pnpm test`, the Supabase push/revert proof, and the end-to-end auth chain the sparring review flagged as the single biggest risk).

Within each dependency level, tasks touching disjoint files are marked `[P]` so a small team could still parallelize without stepping on each other.

---

## Phase A — Cleanup & root configuration (foundational)

- [x] **T001:** Delete the stray untracked `node_modules/` and `yarn.lock` at repo root; add root `.gitignore` covering `node_modules/`, `yarn.lock`, `package-lock.json`, `dist/`, `coverage/`, `.env`, `.env.local`, `supabase/.temp`. Satisfies: FR-001 (precondition, R-1).
      Verify: `git status` shows no untracked `node_modules/` or `yarn.lock`; `.gitignore` is committed and `git check-ignore -v node_modules yarn.lock .env .env.local` reports a match for each.

- [x] **T002:** Create root `package.json` (`private`, `"type": "module"`, `packageManager: pnpm@12.x`, `engines.node >=22`, root scripts `dev`/`build`/`test`/`lint`/`format`/`format:check`/`db:start`/`db:stop`/`db:reset`/`db:push` per plan's Root scripts table) and `pnpm-workspace.yaml` (`packages: [apps/*, packages/*]`, `catalog:` entries for zod/vitest/eslint/prettier/react/react-dom, `allowBuilds: { esbuild: true, supabase: true }`). Satisfies: FR-001 (ADR-1).
      Verify: both files are valid (JSON/YAML parse without error); `pnpm install` run from repo root completes with exit code 0 and no `ERR_PNPM_IGNORED_BUILDS`.

- [x] **T003 [P]:** Create root `.env.example` with every variable from CLAUDE.md plus `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and the commented-out optional API tuning vars (`PORT`, `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGIN`, `TRUST_PROXY`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`), each with a placeholder or inline comment. Satisfies: FR-015.
      Verify: `grep` confirms all of `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY` are present, each on its own line with a placeholder value or a trailing comment.

- [x] **T004 [P]:** Add root `.nvmrc` (Node 24) and confirm `engines.node` in root `package.json` (from T002) matches. Satisfies: FR-001 (supporting).
      Verify: `cat .nvmrc` prints a Node 24 major version; running under a Node-version manager, `nvm use` (or equivalent) picks that version without error.

- [x] **T005 [P]:** Create root `eslint.config.js` (flat config) with path-scoped blocks per ADR-13: browser/JSX globals + `react-hooks` + `react-refresh` for `apps/web/**` and `packages/ui/**`; Node globals for `apps/api/**` and `packages/shared/**`; a vitest-aware block for `**/*.test.{js,jsx}`; `eslint-config-prettier` last; global ignores for `**/dist`, `**/coverage`, `supabase/.temp`. Satisfies: FR-016 (config half — pass/fail is verified once both apps exist, T034).
      Verify: `npx eslint --print-config apps/web/src/main.jsx` and `npx eslint --print-config apps/api/src/app.js` (paths may be placeholders at this point) both resolve without the config file throwing; `node --check eslint.config.js` succeeds.

- [x] **T006 [P]:** Create root `.prettierrc.json` and `.prettierignore` (single shared config per OQ-003). Satisfies: FR-017 (config half).
      Verify: `npx prettier --check .prettierrc.json` runs without a "no config found" error; `.prettierignore` contains `dist`, `coverage`, `pnpm-lock.yaml`, `supabase/.temp`.

- [x] **T007:** Add `supabase` npm package as a root devDependency; run `supabase init` and edit the generated `supabase/config.toml` to set `[db.seed] sql_paths = ["./seed/*.sql"]` and keep email/password auth enabled with `enable_confirmations = false`; add `supabase/migrations/.gitkeep` and `supabase/seed/.gitkeep`. Satisfies: FR-021 (structure half — full local-push proof is T035).
      Verify: `apps/api/../../supabase/migrations` and `supabase/seed` directories exist and are tracked by git (via `.gitkeep`); `pnpm exec supabase --version` prints a version; `config.toml` contains the `sql_paths` line.

## Phase B — Internal package stubs (independent of both apps)

- [x] **T008 [P]:** Scaffold `packages/shared` — `package.json` (`name: "@brainx/shared"`, `"type": "module"`, `"exports": { ".": "./src/index.js" }`), `src/index.js` with a placeholder named export. Satisfies: FR-001 (OQ-004).
      Verify: after T002 and at least one app declares `"@brainx/shared": "workspace:*"` (T010/T026), `pnpm ls -r` lists `@brainx/shared` with no unresolved dependency error.

- [x] **T009 [P]:** Scaffold `packages/ui` — `package.json` (`name: "@brainx/ui"`, same exports pattern), `src/index.js` with a placeholder JSX-capable export, declared as a dependency of `apps/web` only (never `apps/api`). Satisfies: FR-001 (OQ-004, ADR-1 tradeoff).
      Verify: `pnpm why @brainx/ui --filter api` reports no result (not a dependency of the api workspace); `pnpm why @brainx/ui --filter web` resolves to the workspace package.

## Phase C — apps/api (bottom-up: leaf modules → app.js → server.js)

- [x] **T010:** Scaffold `apps/api` skeleton — `package.json` (`name: "api"`, `"type": "module"`, deps incl. Express 5, Helmet, cors, express-rate-limit, pino, pino-http, pino-pretty (dev), dotenv, zod, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `openai`; `workspace:*` on `@brainx/shared`), the nine required `src/` subdirectories (`config/, routes/, controllers/, services/, middleware/, validators/, agents/, integrations/, utils/`) each with a placeholder file, a stub `src/app.js` (`export function createApp() {}`), `vitest.config.js` (`environment: 'node'`), and a `tests/` directory. Satisfies: FR-006.
      Verify: `ls apps/api/src` shows all nine required subdirectories; `test -f apps/api/src/app.js` succeeds; `pnpm install` resolves the new workspace with no missing-peer warnings for the listed deps.

- [x] **T011:** Implement `config/env.js` — loads `<root>/.env.local` then `<root>/.env` via dotenv (real `process.env` wins), parses with a Zod schema (`nodeEnv`, `port`, `logLevel`, `corsOrigin`, `trustProxy`, `rateLimit{windowMs,max}`, `supabase{url,serviceRoleKey}` required, `ai{provider,model,apiKey}` optional), exports a frozen `config` object; fails fast listing missing variable **names only**. Satisfies: FR-015 (consumption), foundational for FR-003.
      Verify: unit test — unsetting `SUPABASE_URL` and requiring the module throws an error whose message contains the string `SUPABASE_URL` and contains no value; with all required vars set, `Object.isFrozen(config)` is `true` and `config.rateLimit.max === 100` by default.

- [x] **T012:** Implement `utils/logger.js` (base pino instance, `level: config.logLevel`, `redact: ['req.headers.authorization', 'req.headers.cookie', '*.apiKey', '*.serviceRoleKey']`), `utils/AppError.js`, `utils/errorCodes.js` (the full code→status table from the plan's API contracts section), `utils/response.js` (`sendSuccess(res, data, status = 200)`), `utils/extractJson.js` (strips ``` fences / leading prose). Satisfies: FR-007, FR-008 (building blocks).
      Verify: unit test — `sendSuccess(mockRes, { foo: 1 })` results in `mockRes.json` called with `{ success: true, data: { foo: 1 } }`; `extractJson('Sure! ```json\n{"a":1}\n```')` returns a string that `JSON.parse`s to `{ a: 1 }`.

- [x] **T013 [P]:** Implement `middleware/errorHandler.js` and `middleware/notFound.js` per the plan's mapping table (`AppError` → its status/code; `ZodError` → 400 `VALIDATION_ERROR`; `entity.too.large` → 413; `entity.parse.failed` → 400 `INVALID_JSON`; else → 500 `INTERNAL_ERROR`, generic message, full error logged server-side). Satisfies: FR-008.
      Verify: unit test mounting only these two middlewares in a throwaway Express app — a thrown `AppError(404,'NOT_FOUND')` produces `{ success:false, error:{ code:'NOT_FOUND', message } }` with no `stack` key in the JSON body; an unhandled generic `Error` produces a 500 envelope with a generic message (not the original `err.message`).

- [x] **T014 [P]:** Implement `middleware/requestLogger.js` (pino-http, `genReqId` honouring `x-request-id` or `crypto.randomUUID()`) and `middleware/rateLimiter.js` (`windowMs: 900000, max: 100, standardHeaders: 'draft-8', legacyHeaders: false`, `handler` calling `next(new AppError(429,'RATE_LIMITED', …))`). Satisfies: FR-003, FR-005.
      Verify: Supertest against a throwaway app with `rateLimit.max` injected to `3` — the 4th request in the window returns 429 with the standard error envelope; captured log output for any request is valid JSON (`JSON.parse` succeeds on the logged line).

- [x] **T015 [P]:** Implement `middleware/validate.js` (`validate({ body?, query?, params? })` → `schema.parse` results stored on `req.validated`) and `validators/common.validators.js` (one reusable example schema, e.g. pagination query) with a unit test of the validate middleware pattern (sparring-review addition — keeps the pattern concrete, not an empty directory). Satisfies: FR-006 (pattern completeness).
      Verify: unit test — a throwaway route wrapped in `validate({ query: paginationSchema })` returns 400 `VALIDATION_ERROR` for an invalid query string and populates `req.validated.query` for a valid one.

- [x] **T016 [P]:** Implement `GET /api/v1/health` — `routes/health.routes.js`, `controllers/health.controller.js`, `services/health.service.js` returning `{ status: 'ok', uptime, timestamp }`. Satisfies: FR-007.
      Verify: Supertest against a throwaway app mounting only this route — `GET /health` returns 200 with body `{ success: true, data: { status: 'ok', uptime: <number>, timestamp: '<ISO 8601 string>' } }`.

- [x] **T017 [P]:** Implement `agents/base/BaseAgent.js` — subclass contract (`name`, `outputSchema` Zod, `buildPrompt(input)`, optional `requiresApproval`), `run()` pipeline (`buildPrompt` → `aiProvider.complete()` → `extractJson` → `JSON.parse` → `outputSchema.safeParse` → throw `AIOutputValidationError` on failure, logging `validation failed`; return validated object on success). Satisfies: FR-013, FR-014 (base class half).
      Verify: unit test with a mock provider — a response that fails `outputSchema.safeParse` throws `AIOutputValidationError` and the mock logger recorded a `validation failed` event; a schema-conformant response returns the parsed object and no error is thrown.

- [x] **T018:** Implement `integrations/supabase/client.js` (lazy singleton, `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } })`), `services/auth.service.js` (`verifyAccessToken(token)` → `supabaseAdmin.auth.getUser(token)` → `{ id, email, role }` or throws), `middleware/requireAuth.js` (extracts Bearer token, calls `authService.verifyAccessToken`, sets `req.user` on success, else `next(new AppError(401,'UNAUTHORIZED'))`). Depends on T011 (config), T012 (AppError). Satisfies: FR-010 (ADR-7).
      Verify: unit test injecting a fake `authService` — a valid-token request sets `req.user = { id, email, role }` and calls `next()` with no error; a missing/invalid-token request calls `next(AppError)` with status 401 and code `UNAUTHORIZED`, and the real service-role client is never invoked in this test (mocked).

- [x] **T019 [P]:** Implement `integrations/ai/index.js` (`createAIProvider(config.ai)` registry `{ anthropic, openai }`, dynamic import of only the selected SDK, throws `AI_NOT_CONFIGURED` for unknown/missing provider), `integrations/ai/errors.js`, `integrations/ai/providers/anthropic.js` and `providers/openai.js` (each exposing `complete({ system, messages, maxTokens, temperature, jsonSchema? }) → AIProviderResult`, mapping usage to `{ inputTokens, outputTokens }`). Depends on T011. Satisfies: FR-012.
      Verify: unit test with the `@anthropic-ai/sdk` and `openai` clients mocked — `createAIProvider({ provider: 'anthropic', ... })` routes `complete()` calls to the Anthropic mock only; changing only the `provider` field to `'openai'` (same call site, no code change) routes to the OpenAI mock only; an unsupported provider string throws with code `AI_NOT_CONFIGURED`.

- [x] **T020:** Implement `GET /api/v1/me` — `routes/me.routes.js` (mounted behind `requireAuth`), `controllers/me.controller.js`, `services/user.service.js` (`getCurrentUser(authUser)` → public DTO). Depends on T018. Satisfies: FR-007, FR-010.
      Verify: Supertest with a fake `authService` injected — a request with a valid Bearer token returns 200 `{ success:true, data:{ user:{ id, email } } }`; a request with no `Authorization` header returns 401 `{ success:false, error:{ code:'UNAUTHORIZED', message } }`.

- [x] **T021:** Implement `agents/orchestrator/Orchestrator.js` — `run(steps, input)` executes agents sequentially, generates `workflowId` via `crypto.randomUUID()`, passes each validated output to the next step, stops and returns `{ status:'awaiting_approval', pending }` before running any step whose agent declares `requiresApproval`, emits Pino events for workflow/agent started/completed and validation-failed. Depends on T017. Satisfies: FR-014.
      Verify: unit test — a 2-step workflow where step 2's agent has `requiresApproval: true` returns `{ status: 'awaiting_approval', pending }` and the mock provider for step 2 was never called (call count 0); a workflow with no approval-gated steps returns `{ status: 'completed', results: [...] }` with a `workflowId` matching UUID format.

- [x] **T022:** Implement `src/app.js` — `createApp(deps)` wiring the full middleware order from the plan (requestLogger → helmet → cors → rateLimiter → `express.json({ limit: '1mb' })` → `/api/v1` router mounting health + me → notFound → errorHandler), injection points `{ config, logger, authService, rateLimit }` with production defaults, no `listen()` call. Depends on T013, T014, T015, T016, T020. Satisfies: FR-003, FR-004, FR-009.
      Verify: Supertest against `createApp({ ...testDeps })` — response headers include `x-content-type-options` (Helmet); `Access-Control-Allow-Origin` matches the configured origin; a `POST` with a >1MB JSON body to any `/api/v1/` path returns 413 with the error envelope; a malformed JSON body returns 400 `INVALID_JSON`; an unmatched path both with and without the `/api/v1` prefix returns 404 `NOT_FOUND` (FR-009's without-prefix rule).

- [x] **T023:** Implement `src/server.js` — loads config, calls `createApp()`, `listen(config.port)`, and registers `SIGTERM`/`SIGINT` handlers for graceful shutdown. Depends on T022. Satisfies: FR-003.
      Verify: `pnpm --filter api start` (with `.env`/`.env.local` populated per `.env.example`) boots, and `curl http://localhost:3000/api/v1/health` returns 200; sending `SIGINT` to the process causes it to log a shutdown message and exit with code 0 within a few seconds.

- [x] **T024:** Write `apps/api` Vitest + Supertest suites — `tests/app.test.js` (helmet/CORS/404-prefix/envelope/413/429/400 `INVALID_JSON`), `tests/auth.test.js` (`requireAuth` with injected fake `authService`), `tests/errorHandler.test.js` (unhandled `Error` → 500 envelope, no stack in body), `tests/agents.test.js` (provider routing by env, Zod pass/fail, orchestrator approval stop). Depends on T022, T020, T021, T019. Satisfies: FR-019.
      Verify: `pnpm --filter api test` (runs `vitest run`) exits with code 0 and the test output lists all four files as executed with no skipped/failed tests.

- [x] **T025 [P]:** Wire `apps/api` ESLint + Prettier — add `eslint`/`prettier` as local devDependencies resolving the root `catalog:` versions, add `lint` (`eslint .`) and `format:check` (`prettier --check . --ignore-path ../../.prettierignore --ignore-path ../../.gitignore`) scripts. Depends on T010, T005, T006. Satisfies: FR-016, FR-017 (per-app half).
      Verify: `pnpm --filter api lint` exits code 0; `pnpm --filter api format:check` exits code 0.

## Phase D — apps/web (bottom-up: lib → features → app shell)

- [x] **T026:** Scaffold `apps/web` — `package.json` (`name: "web"`, `"type": "module"`), `index.html`, `vite.config.js` (`react()`, `tailwindcss()` from `@tailwindcss/vite`, `envDir: '../..'`, `test: { environment: 'jsdom', setupFiles }`, plus the `VITE_SUPABASE_URL` vs `SUPABASE_URL` mismatch check that throws a clear startup error — sparring-review addition, ADR-6/R-6). Depends on T002. Satisfies: FR-002 (build config half).
      Verify: `pnpm --filter web dev` starts without a config error; temporarily setting `VITE_SUPABASE_URL` to a value different from `SUPABASE_URL` in the local env and re-running `dev` fails fast with an explicit mismatch message (not a silent 401 later).

- [x] **T027:** Install and wire `apps/web` runtime dependencies — React, `react-router`, Redux Toolkit + `react-redux`, TanStack Query, Formik, Zod, Axios, `@supabase/supabase-js`, Tailwind CSS v4 + `@tailwindcss/vite`, `workspace:*` on `@brainx/shared` and `@brainx/ui`. Depends on T026, T008, T009. Satisfies: FR-002.
      Verify: `pnpm --filter web dev` starts with a temporary smoke import of each library in `main.jsx` and the Vite output shows no "failed to resolve import" errors for any of them.

- [x] **T028:** Implement `lib/env.js` (Zod-validates `import.meta.env` at startup), `lib/supabase.js` (`createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`), `lib/apiClient.js` (Axios instance, `baseURL: ${VITE_API_URL}/api/v1`, request interceptor calling `supabase.auth.getSession()` and rejecting with `AuthRequiredError` before any network call when there is no session or it is expired — opt-out via `{ skipAuth: true }` — response interceptor unwraps `data.data` and normalises errors to `ApiError`, triggering local `signOut()` on a server 401), `lib/formikZod.js` (`toFormikValidate(schema)`). Depends on T027. Satisfies: FR-011 (client half), FR-002.
      Verify: unit test — calling the wrapped request method with a mocked "no session" `getSession()` rejects with `AuthRequiredError` and the underlying Axios adapter is never invoked (call count 0); with a mocked valid session, the outgoing config has `Authorization: Bearer <token>`; a mocked 401 response triggers the `signOut` mock exactly once.

- [x] **T029:** Implement `features/auth/` — `AuthProvider.jsx` (subscribes to `onAuthStateChange`, exposes `{ session, user, status }` via context), `useAuth.js`, `RequireAuth.jsx` (layout route redirecting to `/login` when `status === 'unauthenticated'`), `LoginPage.jsx` (Formik + `toFormikValidate`), `auth.schemas.js` (Zod login schema). Depends on T028. Satisfies: FR-011.
      Verify: RTL test — rendering `RequireAuth` with a mocked `status: 'unauthenticated'` context renders a redirect to `/login` (no protected content rendered); submitting `LoginPage` with an invalid email shows a Zod-derived validation message and `supabase.auth.signInWithPassword` is never called.

- [x] **T030:** Implement the app shell — `app/store.js` (`configureStore({ reducer: { ui } })`), `app/queryClient.js` (`QueryClient` with retry skipping 4xx), `app/router.jsx` (`createBrowserRouter`: `/login`, `/` behind `RequireAuth` → `HomePage`, `*` → `NotFoundPage`), `app/Providers.jsx` (composes Redux + QueryClient + `AuthProvider` + `RouterProvider`), `features/ui/uiSlice.js`, `main.jsx`, `index.css` (`@import "tailwindcss";`), `pages/HomePage.jsx`, `pages/NotFoundPage.jsx`. Depends on T028, T029. Satisfies: FR-002.
      Verify: `pnpm --filter web dev` renders the app at `localhost:5173` with no console errors; navigating to an unregistered path renders `NotFoundPage` content.

- [x] **T031:** Write `apps/web` Vitest + RTL suite — `test/setup.js` (`@testing-library/jest-dom/vitest`), `test/App.smoke.test.jsx` (renders `<Providers>` tree without throwing). Depends on T030. Satisfies: FR-018.
      Verify: `pnpm --filter web test` (runs `vitest run`) exits code 0 and the output shows `App.smoke.test.jsx` executed and passing.

- [x] **T032 [P]:** Wire `apps/web` ESLint + Prettier — local `eslint`/`prettier` devDependencies resolving the root catalog, `lint` (`eslint .`) and `format:check` (`prettier --check . --ignore-path ../../.prettierignore --ignore-path ../../.gitignore`) scripts. Depends on T026, T005, T006. Satisfies: FR-016, FR-017 (per-app half).
      Verify: `pnpm --filter web lint` exits code 0; `pnpm --filter web format:check` exits code 0.

## Phase E — Cross-cutting closeout and validation

- [x] **T033:** Update root `CLAUDE.md`'s environment-variables section to add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the Architect flagged this as required but out of its own read-only scope in `notes.md`). Depends on T003, T028. Satisfies: FR-020, FR-015.
      Verify: `git diff` for this PR touches only the environment-variables section of `CLAUDE.md`; the updated section lists `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` alongside the existing vars.

- [x] **T034:** Full clean-install and root-script validation — from a clean checkout, run `pnpm install`, `pnpm ls -r`, `pnpm -r lint`, `pnpm format:check`, `pnpm test`. Depends on T007, T008, T009, T022, T024, T025, T030, T031, T032. Satisfies: FR-001 (full), FR-016 (full), FR-017 (full), FR-022.
      Verify: `pnpm ls -r` lists exactly `apps/web`, `apps/api`, `packages/shared`, `packages/ui` with no missing-dependency errors; `pnpm -r lint` and `pnpm format:check` both exit 0; `pnpm test` from the repo root runs both apps' Vitest suites and the process exits with code 0.

- [ ] **T035:** Validate the Supabase local-push path — `supabase start`, then add a throwaway migration file, `supabase db push --local`, confirm it applies, then revert (drop the throwaway table / delete the migration file and re-push to baseline). Depends on T007. Satisfies: FR-021 (full).
      Verify: `supabase db push --local` against the zero-migration baseline reports "nothing to push" with exit code 0; after adding the throwaway migration, `supabase db push --local` applies it with exit code 0; after reverting, the local DB and repo are back to the committed baseline (`git status` clean, `supabase db push --local` reports nothing to push again).

- [ ] **T036:** End-to-end auth chain validation — with the local Supabase stack running (T035) and both apps started (T023, and `pnpm --filter web dev`), create a test user, log in through `LoginPage`, and confirm a real (non-mocked) round trip through `apiClient` → `requireAuth` → `authService.verifyAccessToken` → `GET /api/v1/me`. This is the scenario the sparring review flagged as the single biggest first-run-friction risk (FR-010 + FR-011 together). Depends on T019 (real), T020, T029, T030, T035. Satisfies: FR-010, FR-011.
      Verify: after logging in, the browser's request to `/api/v1/me` returns 200 with the logged-in user's real `id`/`email` (not a fake); after signing out (or letting the session expire), the same page's next authenticated call is blocked client-side by `apiClient` (network tab shows no request fired) and the UI redirects to `/login`.

---

## Dependencies between tasks

```
T001 (cleanup — foundational)
  └─► T002 (root package.json + pnpm-workspace.yaml)
       ├─► T003 [P] .env.example
       ├─► T004 [P] .nvmrc
       ├─► T005 [P] root eslint.config.js
       ├─► T006 [P] root prettier config
       ├─► T007      supabase CLI + supabase/ dirs
       │     └─► T035  supabase local push/revert proof
       ├─► T008 [P] packages/shared stub
       ├─► T009 [P] packages/ui stub
       │
       ├─► T010 apps/api skeleton
       │     └─► T011 config/env.js
       │           └─► T012 utils/* (logger, AppError, errorCodes, response, extractJson)
       │                 ├─► T013 [P] errorHandler + notFound
       │                 ├─► T014 [P] requestLogger + rateLimiter
       │                 ├─► T015 [P] validate.js + common.validators.js
       │                 ├─► T016 [P] health route/controller/service
       │                 ├─► T017 [P] agents/base/BaseAgent.js
       │                 │     └─► T021 agents/orchestrator/Orchestrator.js
       │                 ├─► T018      supabase client + auth.service + requireAuth
       │                 │     └─► T020 me route/controller/service
       │                 └─► T019 [P] integrations/ai/* (registry + providers)
       │
       │     T013 + T014 + T015 + T016 + T020 ──► T022 app.js (createApp, full wiring)
       │           T022 ──► T023 server.js
       │           T022 + T020 + T021 + T019 ──► T024 apps/api Vitest+Supertest suite
       │     T010 + T005 + T006 ──► T025 [P] apps/api lint/format wiring
       │
       ├─► T026 apps/web scaffold (vite.config.js, mismatch check)
       │     T026 + T008 + T009 ──► T027 install web deps
       │           T027 ──► T028 lib/* (env, supabase, apiClient, formikZod)
       │                 └─► T029 features/auth/*
       │                       T028 + T029 ──► T030 app shell (store, queryClient, router, pages)
       │                             T030 ──► T031 apps/web Vitest+RTL suite
       │     T026 + T005 + T006 ──► T032 [P] apps/web lint/format wiring
       │
       T003 + T028 ──► T033 CLAUDE.md env-var update
       │
       T007 + T008 + T009 + T022 + T024 + T025 + T030 + T031 + T032 ──► T034 full clean install + root pnpm test
       │
       T019 + T020 + T029 + T030 + T035 ──► T036 end-to-end auth chain validation
```
