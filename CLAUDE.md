# CLAUDE.md

## Stack

Language: JavaScript (no TypeScript)
Monorepo: pnpm workspaces
Frontend app: `apps/web`
Backend app: `apps/api`

### Frontend
- React + Vite
- React Router
- Tailwind CSS
- Redux Toolkit (global/client state only — do not put API data in Redux)
- TanStack Query (server/API state)
- Formik (complex forms)
- Zod (runtime validation)
- Axios (HTTP client)

### Backend
- Node.js + Express.js
- Pino (structured logging)
- Helmet, CORS, express-rate-limit (security defaults)
- Zod (input validation + AI output validation)
- bcrypt/bcryptjs (only when the app handles passwords directly)

### Database / Platform
- Supabase (PostgreSQL, Auth, Storage)
- `@supabase/supabase-js` — no ORM unless the problem specifically requires one

### AI
- LLM provider abstraction layer — configured via env vars
- Agent orchestration in `apps/api/src/agents/`
- All AI output must be structured JSON, validated with Zod before use

### Testing
- Vitest (frontend + backend)
- React Testing Library (frontend component tests)
- Supertest (backend API tests)

### Code Quality
- ESLint
- Prettier

## Commands

Install: `pnpm install`
Build: `pnpm -r build`
Test: `pnpm -r test`
Lint: `pnpm -r lint`
DB migrations: `supabase db push`
Dev (web): `pnpm --filter web dev`
Dev (api): `pnpm --filter api dev`

## Project structure

```
brainx/
├── apps/
│   ├── web/                 # React frontend
│   └── api/                 # Node.js + Express backend
├── packages/
│   ├── shared/              # Shared utilities, constants, schemas
│   └── ui/                  # Optional reusable UI components
├── supabase/
│   ├── migrations/
│   └── seed/
├── package.json
├── pnpm-workspace.yaml
└── CLAUDE.md
```

Backend internal structure:
```
apps/api/src/
├── config/
├── routes/
├── controllers/
├── services/
├── middleware/
├── validators/
├── agents/
├── integrations/
├── utils/
└── app.js
```

## Project conventions

- No business logic in route handlers — service layer owns it
- All AI output must be structured JSON; validate with Zod before use — never blindly execute AI-generated actions
- AI provider is configurable via env vars (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`) — no hard-coded provider references
- API responses must use `{ success: true, data: {} }` for success and `{ success: false, error: { code, message } }` for errors
- Prefix all API routes with `/api/v1/`
- Supabase service-role key must only exist on the backend — the `VITE_` prefix is forbidden for any secret
- All schema changes go in Supabase migrations — no ad-hoc SQL
- No ORM unless the actual problem specifically requires it
- Every agent must have a single, clearly defined responsibility — no catch-all agents
- Human approval required before irreversible or high-stakes AI actions

## Security rules

- No SQL string interpolation — all database access via Supabase JS client or parameterized queries
- All secrets via env vars; never committed to git
- Maintain `.env.example` with all required variable names (no real values)
- Every Express app must include: Helmet, CORS, express-rate-limit, Zod input validation, auth middleware, centralized error handling
- Never expose internal errors, stack traces, or credentials to the frontend
- Never store passwords in plain text

## Performance notes

- All I/O operations must be async/await
- Use Pino for structured logging on the backend
- Log key AI workflow events: workflow started/completed, agent started/completed, tool called, validation failed, human approval requested
- Capture per-log-event: workflow ID, agent name, status, duration, model, token usage, errors (never log secrets)

## Environment variables

Required in `.env` (never committed; see `.env.example`):

```
VITE_API_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
```

## Org process

Follow the spec-driven workflow: https://github.com/Tntra/ai-engineering-playbook
Agents and skills are in `.claude/` — committed to this repo.

Every non-trivial feature goes through four phases — no phase starts until the previous file has `status: approved`:

1. `spec.md` — what the system must do (FR-NNN acceptance criteria, Given-When-Then format) — Product Manager agent
2. `plan.md` — how it will be built (architecture, ADRs) — Architect agent (`/model opus`)
3. `tasks.md` — atomic checklist with task IDs (T001…), parallelization markers ([P]), verify steps — Planner agent
4. Implement — Developer agent; Reviewer agent gates every PR

Before any PR, run in order:
```
/spec-check
/phase-gate
/code-review
/security-review
```

Small bugfixes, config changes, and one-PR tasks skip directly to implementation.
