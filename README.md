# BrainX

AI-powered web application built with React, Node.js/Express, and Supabase.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v9+ — `npm install -g pnpm`
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`
- A [Supabase](https://supabase.com) project
- An AI provider API key (Anthropic or OpenAI)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd BrainX
pnpm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example apps/api/.env
```

Open `apps/api/.env` and set:

| Variable                    | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| `SUPABASE_URL`              | Your Supabase project URL                               |
| `SUPABASE_ANON_KEY`         | Supabase anon/public key                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only — never expose) |
| `AI_PROVIDER`               | `anthropic` or `openai`                                 |
| `AI_MODEL`                  | e.g. `claude-sonnet-4-6`                                |
| `AI_API_KEY`                | Your AI provider API key                                |

For the frontend, create `apps/web/.env`:

```bash
echo "VITE_API_URL=http://localhost:4000" > apps/web/.env
```

### 3. Apply database migrations

```bash
supabase db push
```

## Running the app

Open two terminals and run each in its own:

```bash
# Terminal 1 — API server (http://localhost:4000)
pnpm dev:api

# Terminal 2 — Web app (http://localhost:5173)
pnpm dev:web
```

## API documentation

Once the API server is running, Scalar API docs are available at:

```
http://localhost:4000/docs
```

The raw OpenAPI 3.1 spec is served at `http://localhost:4000/openapi.json` and can be imported into any compatible client (Postman, Insomnia, etc.).

All authenticated endpoints require a Supabase JWT — pass it as a Bearer token:

```
Authorization: Bearer <supabase-access-token>
```

## Other commands

```bash
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm lint           # Lint all packages
```

### Per-app commands

```bash
pnpm --filter web test       # Frontend tests only
pnpm --filter api test       # Backend tests only
pnpm --filter web build      # Frontend build only
pnpm --filter api build      # Backend build only
```

## Project structure

```
brainx/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Node.js + Express backend
├── packages/
│   ├── shared/       # Shared utilities, constants, schemas
│   └── ui/           # Reusable UI components
├── supabase/
│   ├── migrations/
│   └── seed/
└── CLAUDE.md         # AI assistant instructions
```

## Hackathon tooling

Three slash commands keep the team aligned to the judging criteria throughout hackathon day:

| Command            | When                    | What it does                                                                            |
| ------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `/hackathon-align` | Morning — before coding | Interactive 8-question session → alignment brief with projected scores + build priority |
| `/hackathon-check` | Midday                  | Scores current repo state → RAG scorecard + time-weighted action list                   |
| `/hackathon-demo`  | End of build phase      | Final score + 5-min timed demo script + per-criterion talking points + judge Q&A prep   |

Output files land in `docs/hackathon/`. All three commands are backed by the **Hackathon Scorer** agent which reads the repo and scores all six criteria against observable evidence.

## Deployment

| Service               | Platform                     |
| --------------------- | ---------------------------- |
| Frontend (`apps/web`) | Vercel                       |
| Backend (`apps/api`)  | Render / Railway / Cloud Run |
| Database              | Supabase                     |
