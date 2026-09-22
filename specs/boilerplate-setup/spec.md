---
feature: boilerplate-setup
status: approved
owner: AminTaiTntra
created: 2026-09-22
approved-by: AminTaiTntra
approved-date: 2026-09-22
---

# Spec: Boilerplate Setup

> Do not mix "what the system must do" with "how it will be built." Tech stack and implementation choices belong in `plan.md`.

## Context

BrainX is a pnpm monorepo intended to serve as a reusable hackathon foundation — a pre-wired scaffold that allows a team to begin domain-specific implementation immediately upon receiving a problem statement. The boilerplate-setup feature establishes the full repository structure, installs all required dependencies, configures all tooling, wires authentication end-to-end, and provides a functional local development environment. Without this foundation, every hackathon attempt must spend its first hours on infrastructure instead of domain logic.

## Technical requirements

- The repository must be structured as a pnpm monorepo with workspaces for `apps/web` (React/Vite), `apps/api` (Node.js/Express), `packages/shared`, and `packages/ui`.
- The frontend must have React Router, Tailwind CSS, Redux Toolkit, TanStack Query, Formik, Zod, and Axios installed and importable.
- The backend must expose an Express application with Helmet, CORS, express-rate-limit, and a 1 MB JSON payload limit applied globally, and Pino as the structured logger.
- The backend must be structured with the directories: `config/`, `routes/`, `controllers/`, `services/`, `middleware/`, `validators/`, `agents/`, `integrations/`, `utils/`, and an `app.js` entry point. No business logic may reside in route handlers.
- All API responses must conform to `{ success: true, data: {} }` on success and `{ success: false, error: { code, message } }` on error, served under the `/api/v1/` prefix.
- The system must include a centralized error-handling middleware that catches unhandled errors and returns the standardised error envelope without exposing stack traces or credentials.
- Supabase Auth must be wired end-to-end: the React frontend authenticates via Supabase, obtains a session token, and sends it on requests to the Express API; the API validates the token via an auth middleware before authorising any protected route.
- The backend must include an AI provider abstraction layer configurable via `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY` environment variables, supporting at minimum Anthropic and OpenAI. The layer must expose a base agent class and an orchestrator. All AI output must be parsed as structured JSON and validated with Zod before any action is taken.
- Environment configuration must use `.env`, `.env.local`, and `.env.example` files. The `.env.example` must document all required variables: `VITE_API_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`.
- ESLint and Prettier must be configured for both `apps/web` and `apps/api`.
- Vitest with React Testing Library must be configured in `apps/web`; Vitest with Supertest must be configured in `apps/api`. Both test suites must be runnable from the monorepo root via `pnpm test`.
- A `CLAUDE.md` must exist at the monorepo root encoding repository conventions for AI agent consumption.
- Supabase migrations must live under `supabase/migrations/`. Schema changes are applied only through migrations, never through direct SQL against the database.

## Acceptance criteria

- [ ] **FR-001:** Monorepo workspace structure is valid
      Given the repository has been cloned and `pnpm install` has been run from the root
      When `pnpm ls -r` is executed
      Then the output lists four workspaces: `apps/web`, `apps/api`, `packages/shared`, and `packages/ui` with no missing dependency errors.

- [ ] **FR-002:** Frontend dependencies are installed and resolvable
      Given `pnpm install` has completed in `apps/web`
      When a Vite dev build is started (`pnpm --filter web dev`)
      Then the process starts without import resolution errors for React, React Router, Tailwind CSS, Redux Toolkit, TanStack Query, Formik, Zod, and Axios.

- [ ] **FR-003:** Backend starts with all middleware active
      Given environment variables are set per `.env.example` and `pnpm --filter api start` is run
      When an HTTP request is sent to any route
      Then the response includes Helmet security headers (e.g. `x-content-type-options`), a CORS header appropriate to the configured origin, and the request is logged as structured JSON by Pino.

- [ ] **FR-004:** Payload limit is enforced
      Given the API server is running
      When a POST request with a JSON body larger than 1 MB is sent to any `/api/v1/` route
      Then the server returns HTTP 413 and a response conforming to `{ success: false, error: { code, message } }`.

- [ ] **FR-005:** Rate limiting is enforced
      Given the API server is running with its default rate-limit configuration (15-minute window, 100 requests per IP)
      When a single IP address sends more than 100 requests within a 15-minute window
      Then subsequent requests from that IP return HTTP 429 and a response conforming to `{ success: false, error: { code, message } }`.

- [ ] **FR-006:** Backend directory structure matches the specification
      Given the repository has been cloned
      When the `apps/api/src/` directory is listed
      Then the following subdirectories are present: `config/`, `routes/`, `controllers/`, `services/`, `middleware/`, `validators/`, `agents/`, `integrations/`, and `utils/`, and `app.js` exists at `apps/api/src/app.js`.

- [ ] **FR-007:** Successful API response envelope is correct
      Given the API server is running and a route exists that returns data successfully
      When a valid request is made to that route
      Then the response body is `{ "success": true, "data": { … } }` with HTTP 2xx.

- [ ] **FR-008:** Error API response envelope is correct
      Given the API server is running and a request triggers an error (e.g. validation failure or unhandled exception)
      When the centralised error middleware handles the error
      Then the response body is `{ "success": false, "error": { "code": "<string>", "message": "<string>" } }` with an appropriate HTTP 4xx or 5xx status, and no stack trace or internal credential appears in the response body.

- [ ] **FR-009:** Routes are served under /api/v1/ prefix
      Given the API server is running
      When any application route is requested without the `/api/v1/` prefix
      Then the server returns HTTP 404; when the same route is requested with the `/api/v1/` prefix, it returns the expected response.

- [ ] **FR-010:** Supabase Auth token is validated by the Express auth middleware
      Given a valid Supabase session token issued after a successful login on the frontend
      When that token is sent as a Bearer token in the `Authorization` header to a protected Express route
      Then the middleware resolves the user identity and the request proceeds; when no token or an invalid token is sent, the middleware returns HTTP 401 with the standard error envelope.

- [ ] **FR-011:** Frontend Supabase Auth session is established
      Given the frontend is running and the user submits valid credentials via the Supabase Auth flow
      When authentication succeeds
      Then a session is stored client-side and the access token is accessible for use in subsequent API requests; when the session expires or is absent, authenticated API calls are blocked at the client before reaching the server.

- [ ] **FR-012:** AI provider abstraction is configurable via environment variables
      Given `AI_PROVIDER` is set to `anthropic` and `AI_API_KEY` contains a valid Anthropic key
      When a request is made through the AI abstraction layer
      Then it routes to the Anthropic API; when `AI_PROVIDER` is changed to `openai` and the key updated, the same call routes to the OpenAI API without any code change.

- [ ] **FR-013:** AI output is validated with Zod before use
      Given the AI abstraction layer has received a response from an LLM provider
      When the raw response does not conform to the expected structured JSON schema
      Then a Zod validation error is thrown and no downstream action is taken; when the response conforms, the validated object is returned to the caller.

- [ ] **FR-014:** Agent base class and orchestrator are present
      Given the repository has been cloned
      When the `apps/api/src/agents/` directory is listed
      Then a `base/` subdirectory containing an agent base class file and an `orchestrator/` subdirectory containing an orchestrator file are both present.

- [ ] **FR-015:** .env.example documents all required variables
      Given the repository root is inspected
      When `.env.example` is read
      Then it contains entries for each of: `VITE_API_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY`, each with a placeholder value or inline comment describing the expected format.

- [ ] **FR-016:** Linting passes on both apps
      Given ESLint is configured for `apps/web` and `apps/api`
      When `pnpm --filter web lint` and `pnpm --filter api lint` are run against the scaffolded codebase
      Then both commands exit with code 0.

- [ ] **FR-017:** Prettier formatting is enforced
      Given a single root-level Prettier config exists at the monorepo root
      When `pnpm --filter web format:check` and `pnpm --filter api format:check` are run against the scaffolded codebase
      Then both commands exit with code 0.

- [ ] **FR-018:** Frontend test suite runs
      Given Vitest and React Testing Library are configured in `apps/web`
      When `pnpm --filter web test` is run
      Then at least one smoke test executes and the suite exits without configuration errors.

- [ ] **FR-019:** Backend test suite runs
      Given Vitest and Supertest are configured in `apps/api`
      When `pnpm --filter api test` is run
      Then at least one smoke test for the Express app executes and the suite exits without configuration errors.

- [ ] **FR-020:** CLAUDE.md exists at repository root
      Given the repository has been cloned
      When the repository root is listed
      Then `CLAUDE.md` is present and contains at minimum the monorepo workspace layout and the coding conventions expected by agents working in this codebase.

- [ ] **FR-021:** Supabase migrations directory is present
      Given the repository has been cloned
      When the `supabase/` directory is listed
      Then a `migrations/` subdirectory exists; schema changes applied via `supabase db push` succeed against a local Supabase instance without errors.

- [ ] **FR-022:** pnpm test at root runs all suites
      Given both `apps/web` and `apps/api` test suites are configured
      When `pnpm test` is run from the monorepo root
      Then both test suites execute and the process exits with code 0 if all tests pass.

## Out of scope

- Domain-specific database schema or migrations — the migrations directory is scaffolded but no application tables are created.
- Any product feature, domain logic, or agent instruction set — those are implemented after a problem statement is received.
- TypeScript configuration — this project intentionally uses plain JavaScript throughout.
- Turborepo or any build orchestration layer beyond pnpm workspaces.
- ORM setup (Prisma, Drizzle, etc.) — the project uses `@supabase/supabase-js` directly.
- CI/CD pipeline configuration (GitHub Actions, etc.) — deployment tooling is a separate concern.
- Production deployment configuration for Vercel, Render, Railway, or Cloud Run — the boilerplate targets local dev only.
- Seed data for any business domain — only infrastructure-level seed scripts (e.g. Supabase role setup) are in scope if required by Supabase Auth configuration.
- UI component library population in `packages/ui` — the package is scaffolded but no components are implemented.
- OAuth provider configuration beyond Supabase email/password Auth — additional providers are domain-specific choices.
- `packages/shared` content beyond the directory scaffold — shared utilities are added as domain logic emerges.

## Decisions

- **OQ-001 → resolved:** Auth middleware uses `admin.auth.getUser()` (service-role key, server-side verification). Simpler implementation, automatic revocation support, no client-side JWT verification complexity.

- **OQ-002 → resolved:** Default rate limit is 15-minute window / 100 requests per IP. Applied globally; no separate limits for authenticated vs. unauthenticated routes in the scaffold.

- **OQ-003 → resolved:** Single root-level ESLint and Prettier config shared across all workspaces. New apps inherit rules automatically; per-app overrides added only when needed.

- **OQ-004 → resolved:** `packages/shared` is consumed via pnpm path aliases — no build step required. Both `apps/web` and `apps/api` import directly from the source. No watch/compile overhead.
