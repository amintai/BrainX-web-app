---
feature: boilerplate-setup
---

# Notes: Boilerplate Setup

Append-only log of decisions, deviations from the plan, and tradeoffs made during implementation. Do not edit or delete earlier entries — add new dated entries below.

## 2026-09-23 — Plan drafted (Architect agent), status: in-review

### Findings while planning

- Repo root contains untracked `node_modules/` and an empty `yarn.lock` from a stray `yarn` run. Both must be removed before the first `pnpm install` (plan R-1).
- pnpm is at 12.x. `onlyBuiltDependencies` was removed in v11 and replaced by `allowBuilds` in `pnpm-workspace.yaml`. `strictDepBuilds` defaults to `true`, so an unlisted postinstall script (esbuild, supabase CLI) fails the install with `ERR_PNPM_IGNORED_BUILDS`. That would break FR-001, so `allowBuilds` is mandatory (ADR-1). Source: https://pnpm.io/settings/build
- Constitution conflict: the playbook template requires `{ error: string }`, but CLAUDE.md and the approved spec require `{ success: false, error: { code, message } }`. Resolved as a justified exception in ADR-3. **Recommendation:** update the org plan template so projects using the richer envelope don't need an exception every time.
- CLAUDE.md's env list has no browser-visible Supabase vars, but FR-011 needs the Supabase URL and anon key in the browser. The plan adds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (both public by design) plus optional API tuning vars (ADR-6). **CLAUDE.md needs updating during implementation** (the Architect is read-only on CLAUDE.md).
- The spec's OQ-001 wording "admin.auth.getUser()" is read as `supabase.auth.getUser(jwt)` on a service-role client. `auth.admin.getUserById` is a different API and is not used.

### Sparring partner review

**Step 1 — Attack**

1. Calling `getUser(jwt)` on every protected request means a network round trip for each one. It adds latency, runs into Supabase Auth rate limits, and takes the API's protected surface down whenever Auth is down.
2. Two hand-written AI adapters reinvent what the Vercel AI SDK already does. Prompt-instructed JSON is weaker than native structured output, so expect more validation failures.
3. Duplicating `VITE_SUPABASE_URL` and `SUPABASE_URL` invites drift. If the frontend and backend point at different projects, every token gets a 401 and nothing says why. For a boilerplate whose whole value is "working in minutes", that is a first-run failure.
4. The root ESLint config uses path globs, so "new apps inherit rules automatically" (OQ-003) is only partly true. A new app gets base rules but not runtime-specific ones.
5. Source-consumed `@brainx/ui` can hold JSX. If anyone adds it to `apps/api`, Node crashes.
6. The rate limiter keeps its counts in memory, which is useless across multiple instances, and it misattributes client IPs behind a proxy.
7. Loading AI config lazily hides a misconfiguration until the first AI call.
8. With `validators/` empty and no route exercising it, developers will guess at the pattern and do it inconsistently.
9. Sixteen ADRs is process overhead for a scaffold.

**Step 2 — Steelman**

1. `getUser` was already decided in the spec (OQ-001). It honours revocation, and it sits behind `authService`, so swapping in JWKS verification later touches one file.
2. Only two providers are required. First-party SDKs are the most stable surface. The adapter keeps our Zod validation explicit and visible, which is what CLAUDE.md asks for, and the `jsonSchema` hint lets an adapter turn on native structured output without changing any agent.
3. Explicit `VITE_` names keep Vite's default "only `VITE_*` is public" guard, which is the strongest protection against bundling the service-role key. The alternatives (`envPrefix` or `define` tricks) are one careless edit away from a secret leak.
4. The spec asked for exactly one root config (OQ-003). Adding a glob for a new app is a one-line change.
5. `@brainx/ui` is only declared as a dependency of web, so pnpm's strict `node_modules` makes an undeclared import from api fail at resolution.
6. The spec scope is local development only. `TRUST_PROXY` and a swappable store are documented.
7. The scaffold has to boot on day one of a hackathon, before anyone has an AI key. Failing with `AI_NOT_CONFIGURED` on first use is explicit, not silent.
9. Every ADR records a real fork where a reasonable engineer would choose differently. Writing them down once saves a debate at every hackathon.

**Step 3 — Honest verdict**

The plan holds up. The single biggest risk is **first-run friction in the end-to-end auth chain** (FR-010/FR-011): Docker, the local Supabase keys, and two copies of the Supabase URL all have to line up before login works. That is where a team loses its first hour, which is exactly what this feature exists to prevent.

Changes made to the plan as a result:

- **Added** a mismatch check in `vite.config.js` that fails dev start with a clear message when `VITE_SUPABASE_URL` differs from `SUPABASE_URL` (ADR-6, R-6).
- **Added** `validators/common.validators.js` with an example reusable schema plus a unit test of `validate` middleware, so the validation pattern is concrete rather than an empty directory (attack point 8).
- **Documented** a hosted-Supabase fallback for machines without Docker (ADR-15, R-15).
- **Kept** `getUser` (spec decision), the official-SDK adapters, and lazy AI config. The attack points are real but acceptable for scope, and each has a one-file escape hatch.

Next step: Architecture Review Board sign-off. The Architect must not set `status: approved`.

## 2026-09-23 — Tasks drafted (Planner agent), plan status confirmed approved

`plan.md` frontmatter shows `status: approved` (approved-by AminTaiTntra/deepti.jakhotra, 2026-09-23) and every constitution-check line is ticked `[x]` — confirmed before writing `tasks.md`.

- Chose **Dependency Order** as the execution strategy (not MVP First / Incremental / Parallel team): this feature is one cohesive scaffold, not a set of prioritizable user stories — nearly every task requires an earlier task's files to exist (e.g. `requireAuth` needs `config/env.js` and `AppError` first). Documented the reasoning in `tasks.md`'s "Execution strategy" section.
- 36 tasks (T001–T036), covering: root cleanup (R-1), root workspace/package config with `allowBuilds` (R-2), root ESLint/Prettier/env-example, Supabase CLI + directory scaffold, `packages/shared` and `packages/ui` stubs (OQ-004), `apps/api` built bottom-up (config → utils → middleware → routes/health → agents/BaseAgent → auth service/requireAuth → me route → AI provider registry → orchestrator → `app.js` → `server.js` → tests → lint/format), `apps/web` built bottom-up (vite scaffold + Supabase URL mismatch check → deps → `lib/*` incl. the auth-gating Axios interceptor → `features/auth` → app shell → tests → lint/format), and closeout tasks: `CLAUDE.md` env-var update, full clean-install/root-`pnpm test` validation, the Supabase local push-then-revert proof (ADR-15), and an explicit end-to-end auth-chain validation task.
- Every FR-001…FR-022 maps to at least one task; several (FR-001, FR-016, FR-017, FR-021, FR-022) are deliberately split across an earlier "config exists" task and a later "full validation" task, mirroring how the plan itself phrases those acceptance criteria (they require the whole monorepo to exist to check, e.g. `pnpm ls -r` listing four workspaces).
- Flagged as highest-risk/most-care tasks in the handback to the Developer agent: **T022** (`app.js` — middleware order is load-bearing per the plan; a reordering silently breaks FR-004/005/009), **T018** (`requireAuth`/`authService` — security-critical 401 path, ADR-7's revocation-honouring design must not be weakened to a cheaper local-JWT check without a new ADR), **T026** (the `VITE_SUPABASE_URL`/`SUPABASE_URL` mismatch check — the sparring review's top first-run-friction risk), and **T036** (end-to-end auth chain — the sparring review's single biggest risk; it is the only task that exercises the real, non-mocked Supabase round trip).
- Did not write or edit any implementation code; `tasks.md` left at `status: draft` per the template (Phase 3 approval is a soft/informal skim per `docs/spec-driven-development.md`, not a hard gate) — a senior engineer should skim before Phase 4 begins.

## 2026-09-23 — Implementation (Developer agent), T001–T034 complete

- Executed T001–T034 in the dependency order given. All Verify steps for these tasks were run and passed in this environment (pnpm 12.5.1 installed via `npm install -g pnpm`; Corepack's own `pnpm` shim failed with an `EPERM` on this machine's `C:\Program Files\nodejs`, so a global npm install was used instead — no change to the committed `packageManager` field, which still pins `pnpm@12.5.1`).
- **Deviation (T034 / OQ-003):** root `pnpm format:check` (`prettier --check .`) also matches pre-existing prose/process files that predate and sit outside this feature's scope (`CLAUDE.md`, `docs/`, `.claude/`, `specs/`, `templates/`, `README.md`). Reformatting them was out of this task's remit (and `specs/*` must not be edited without flagging), so they were added to `.prettierignore` rather than reformatted. This keeps `pnpm format:check` green for the code the plan actually asks Prettier to police (the four workspaces) without silently rewriting other agents' authored content.
- **Deviation (ADR-12 / react-router):** pinned `react-router` to `7.9.6` explicitly. `npm view react-router version` resolves to `8.4.0` by default; ADR-12 specifically chose v7 data-mode APIs, so the newest v7 patch was pinned instead of latest.
- Package versions not pinned by an ADR (React, Vite, TanStack Query, Formik, Axios, Tailwind v4, testing-library, Express 5, Helmet, pino, Supertest, Anthropic/OpenAI SDKs, Supabase CLI/js, etc.) were resolved to whatever `npm view <pkg> version` returned at implementation time (2026-09-23) and pinned exactly (no `^`/`~`) in each `package.json`, consistent with "exact versions are pinned by pnpm-lock.yaml" — no ADR named a specific version for these, only the library choice itself, which was followed as written.
- T023's Verify step has two parts: (a) `pnpm --filter api start` + `curl /api/v1/health` — confirmed manually, 200 OK with Helmet headers and a structured JSON pino log line; (b) SIGINT → graceful shutdown log + exit 0. Part (b) could not be automated in this Windows/Git-Bash environment: Windows only delivers a catchable Ctrl+C to processes sharing the parent's console, and a piped/spawned child process instead receives a hard terminate regardless of the signal name passed to `child.kill()`/`taskkill`. This is a documented Node-on-Windows platform limitation, not a defect in `server.js` — the code correctly registers `process.on('SIGTERM'/'SIGINT', ...)` with a graceful `server.close()` callback; this one sub-check is flagged as unverified-in-this-environment rather than silently checked off.
- Test placement note (not a deviation from any ADR): the plan's directory detail lists exactly four files under `apps/api/tests/` (`app.test.js`, `auth.test.js`, `errorHandler.test.js`, `agents.test.js`), matching FR-019/T024. Several earlier tasks (T011 env.js, T012 utils, T015 validate.js) specify their own unit-test Verify step but have no dedicated home in that four-file list. Rather than treat those as throwaway/unsaved tests, they were committed as small co-located `*.test.js` files next to the source they cover (e.g. `src/config/env.test.js`, `src/utils/response.test.js`, `src/middleware/validate.test.js`) so the coverage persists and still runs under `vitest run` / `pnpm test`. The four files T024 names are also present and are the ones FR-019's Verify step checks by name.

## 2026-09-23 — Post-review remediation (Developer agent), 6 of 12 `/code-review` findings fixed

Fixed exactly the 6 findings the user selected from the prior `/code-review` pass; the other 6 (Orchestrator/Redux speculative generality, AI-provider code duplication, shallow pino redact paths, `me.routes.js` default-param footgun) are intentionally untouched and remain open follow-ups.

- **`TRUST_PROXY` never applied**: `createApp()` now calls `app.set('trust proxy', config.trustProxy)` right after `express()`. Added two `app.test.js` cases asserting `app.get('trust proxy')` reflects both `true` and the default `false`.
- **`jsonSchema` dropped by both AI providers**: Anthropic's adapter now forces a `tool_use` call (`tools: [{ name: 'structured_output', input_schema: jsonSchema }]`, `tool_choice: { type: 'tool', name: 'structured_output' }`) and serialises the tool's `input` back to a JSON string so `BaseAgent`'s existing `extractJson` → `JSON.parse` → Zod pipeline needs no change. OpenAI's adapter now sets `response_format: { type: 'json_schema', json_schema: { name: 'structured_output', schema: jsonSchema } }` (left `strict` unset/default rather than `true`, since Zod-generated schemas don't reliably satisfy OpenAI's strict-mode constraints — `additionalProperties: false` + all-required — and forcing that could turn previously-working schemas into 400s). Verified both SDK versions actually installed (`@anthropic-ai/sdk@0.128.0`, `openai@7.23.0`) support these shapes before using them. Added call-arg assertions in `agents.test.js` for both providers and for `BaseAgent` → provider threading.
- **`workflowId`/model/usage not logged per agent**: `Orchestrator.run()` now passes its generated `workflowId` into `agent.run(current, workflowId)`. `BaseAgent.run(input, workflowId)` logs `{ agent, workflowId }` on "agent started" and `{ agent, workflowId, model: result.model, usage: result.usage, durationMs }` on "agent completed". **Judgment call**: model and token usage are only known after the provider call returns, so they could not honestly be included in the "agent started" log (which fires before the call) — only `workflowId` and `agent` are logged at start; both are logged at completion, which is where CLAUDE.md's "capture per-log-event" list is actually satisfiable for those two fields.
- **`AuthRequiredError` missing `.status`**: constructor now sets `this.status = 401`, so `queryClient.js`'s `shouldRetry` (which already special-cases numeric 4xx) fails fast on it instead of retrying up to 3 times. Exported `shouldRetry` from `queryClient.js` (was previously unexported) purely so it has a unit-testable seam; added `apps/web/src/app/queryClient.test.js` and a status assertion in `apiClient.test.js`.
- **`BaseAgent.maxRetries` declared but unused**: chose option (a), a real retry loop, over deleting the field — it was a contained change (looping the existing parse/validate block) and a working retry is more valuable than a docs-only field for an agent framework meant to be reused. Retries only cover JSON-parse/schema-validation failures (not provider/network errors, which throw immediately — resending an identical request doesn't fix a transport failure). Did **not** feed the validation error back into the prompt as corrective context (left as future work) — the task marked that as optional, and every provider call currently reuses the exact same `prompt` object built once at the top of `run()`, so adding corrective re-prompting would mean restructuring `buildPrompt`'s contract for every subclass, which is beyond a "contained" fix. Added `agents.test.js` cases for a successful retry-then-recover and for exhausting all retries.
- **`extractJson.js` fragile positional fallback**: replaced the first-`{`/last-`}` slice with a real bracket-depth scanner that walks characters, tracks a stack of expected closers, and is string-literal- and escape-aware. Throws a clear `Error` (not a malformed slice) when no balanced value is found or when brackets are mismatched. Added test cases that would have broken the old heuristic: a stray unmatched brace in trailing prose, multiple JSON-like blocks in one string (must stop at the first complete one), braces inside a string value, and escaped quotes inside a string value.
- Ran `pnpm -r test` and `pnpm -r lint` from repo root after all six fixes: both exit 0 (43/43 `apps/api` tests, 11/11 `apps/web` tests passing; lint has one pre-existing `react-refresh/only-export-components` warning in `AuthProvider.jsx`, 0 errors, untouched by this pass). Ran `prettier --write` on the two new/edited test files that failed `--check` after edits (`extractJson.test.js`, `agents.test.js`), then re-ran the full suite and lint to confirm still green.
