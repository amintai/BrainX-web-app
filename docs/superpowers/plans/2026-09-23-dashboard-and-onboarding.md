# Dashboard Metrics + Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live metric cards and a role-distribution chart to the empty dashboard, and add a first-login onboarding wizard that collects the user's display name before they reach the app.

**Architecture:** Dashboard reads from a new admin-only `GET /api/v1/stats` endpoint (role counts from `profiles`) and renders four `MetricCard` components plus a Recharts `BarChart`; non-admin users see all-zero placeholders with no API call. Onboarding adds an `onboarding_completed_at` column to `profiles`; `SidebarLayout` calls `useOnboardingGuard` which redirects to `/onboarding` when the field is null; the wizard collects a name (Step 1), shows feature tiles (Step 2), and completes via `PATCH /api/v1/users/me/onboarding/complete` (Step 3).

**Tech Stack:** TypeScript, Express, Supabase JS, Zod, Vitest + Supertest (API), React + Vite, TanStack Query, Recharts (new), Tailwind CSS, Vitest + React Testing Library (web)

**Specs:**

- `docs/superpowers/specs/2026-09-23-dashboard-metrics-design.md`
- `docs/superpowers/specs/2026-09-23-onboarding-wizard-design.md`

## Global Constraints

- All API routes prefixed `/api/v1/`
- API success shape: `{ success: true, data: {} }` — use `sendSuccess(res, data)`
- API error shape: `{ success: false, error: { code, message } }` — use `sendError(res, { code, message }, status)`
- All Supabase access via `supabaseAdmin` (service role, backend only)
- `AppError` class from `../middleware/error.middleware` for thrown errors
- Frontend HTTP calls via `client` from `../../utils/client` (Axios, auto-attaches JWT)
- Frontend data fetching via `useApiQuery` / `useApiMutation` hooks (existing patterns)
- No ORM — raw Supabase JS queries only
- All schema changes go in `supabase/migrations/` — no ad-hoc SQL
- Shared types only in `packages/shared/src/` — never import backend types into frontend

## Review Focus

1. **Non-admin on dashboard** — `useApiQuery` for stats must be `enabled: isAdmin`; a non-admin must see four zero-value cards and no chart, with no 403 toast. Task 2 covers this in the test.
2. **Onboarding guard loop** — `useOnboardingGuard` must NOT redirect if already on `/onboarding`; the hook is in `SidebarLayout` which `/onboarding` bypasses via `OnboardingLayout`. Verified structurally in Task 4 — add a unit test that the guard does not navigate when `onboarding_completed_at` is non-null.
3. **Step 1 empty name** — the Continue button must stay disabled and the PATCH must not fire when `fullName.trim()` is empty. Task 5 test covers this.
4. **Skip from step 2 or 3** — must call `completeMutation.mutate()` immediately, invalidate `['profile', 'me']`, and navigate to dashboard even if the user never reached step 3. Task 5 test covers this.
5. **Stats Supabase failure** — `getStats` must throw `AppError(500, 'FETCH_FAILED')` when the query errors; the controller propagates it through `next(err)`. Task 1 test covers this.

---

### Task 1: Stats API endpoint (backend)

**Files:**

- Create: `apps/api/src/services/stats.service.ts`
- Create: `apps/api/src/controllers/stats.controller.ts`
- Create: `apps/api/src/routes/stats.routes.ts`
- Modify: `apps/api/src/routes/index.ts` — mount `/stats`
- Create: `apps/api/src/__tests__/stats.test.ts`

**Interfaces:**

- Consumes: `supabaseAdmin.from('profiles').select('role')` (same pattern as `users.service.ts`)
- Produces: `GET /api/v1/stats` → `{ userCount, adminCount, managerCount, memberCount }` consumed by Task 2

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/__tests__/stats.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { supabaseAdmin } from '../integrations/supabase';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@brainx.io',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockAdminUser = {
  ...mockUser,
  id: '00000000-0000-0000-0000-000000000002',
  email: 'admin@brainx.io',
  app_metadata: { role: 'admin' },
};

const mockProfiles = [
  { role: 'admin' },
  { role: 'admin' },
  { role: 'manager' },
  { role: 'member' },
  { role: 'member' },
  { role: 'member' },
];

describe('GET /api/v1/stats', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/v1/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when authenticated as non-admin', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });

    const res = await request(app).get('/api/v1/stats').set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 200 with role counts when admin', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
    } as never);

    const res = await request(app).get('/api/v1/stats').set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      userCount: 6,
      adminCount: 2,
      managerCount: 1,
      memberCount: 3,
    });
  });

  it('returns 500 when Supabase query fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockAdminUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('DB down') }),
    } as never);

    const res = await request(app).get('/api/v1/stats').set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FETCH_FAILED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter api exec vitest run src/__tests__/stats.test.ts
```

Expected: 4 tests fail — `Cannot find module '../app'` or route not found (404).

- [ ] **Step 3: Create `apps/api/src/services/stats.service.ts`**

```typescript
import { supabaseAdmin } from '../integrations/supabase';
import { AppError } from '../middleware/error.middleware';

export interface StatsData {
  userCount: number;
  adminCount: number;
  managerCount: number;
  memberCount: number;
}

export const getStats = async (): Promise<StatsData> => {
  const { data, error } = await supabaseAdmin.from('profiles').select('role');

  if (error) throw new AppError('Failed to fetch stats', 500, 'FETCH_FAILED');

  const rows = (data ?? []) as { role: string }[];
  return {
    userCount: rows.length,
    adminCount: rows.filter((r) => r.role === 'admin').length,
    managerCount: rows.filter((r) => r.role === 'manager').length,
    memberCount: rows.filter((r) => r.role === 'member').length,
  };
};
```

- [ ] **Step 4: Create `apps/api/src/controllers/stats.controller.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as StatsService from '../services/stats.service';

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await StatsService.getStats();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 5: Create `apps/api/src/routes/stats.routes.ts`**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { ROLE_ADMIN } from '@brainx/shared';
import * as StatsController from '../controllers/stats.controller';

const router = Router();
router.use(authenticate);
router.get('/', authorize([ROLE_ADMIN]), StatsController.getStats);

export default router;
```

- [ ] **Step 6: Mount the stats router in `apps/api/src/routes/index.ts`**

Add after the existing `router.use('/users', usersRoutes);` line:

```typescript
import statsRoutes from './stats.routes';
// ...
router.use('/stats', statsRoutes);
```

The full updated `routes/index.ts` should look like:

```typescript
import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../integrations/supabase';
import { sendSuccess, sendError } from '../utils/response';
import usersRoutes from './users.routes';
import statsRoutes from './stats.routes';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) throw error;
    sendSuccess(res, { status: 'ok', db: 'connected' });
  } catch {
    sendError(res, { code: 'SERVICE_UNAVAILABLE', message: 'Database unreachable' }, 503);
  }
});

router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);

export default router;
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
pnpm --filter api exec vitest run src/__tests__/stats.test.ts
```

Expected: 4/4 pass.

- [ ] **Step 8: Run full API suite to confirm no regressions**

```bash
pnpm --filter api exec vitest run
```

Expected: 14/16 pass (the 2 pre-existing `app.test.ts` failures remain unrelated).

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/services/stats.service.ts \
        apps/api/src/controllers/stats.controller.ts \
        apps/api/src/routes/stats.routes.ts \
        apps/api/src/routes/index.ts \
        apps/api/src/__tests__/stats.test.ts
git commit -m "feat(api): add GET /api/v1/stats endpoint with role counts"
```

---

### Task 2: Dashboard frontend — MetricCard, RoleChart, DashboardPage

**Files:**

- Modify: `apps/web/src/utils/endpoints.ts` — add `stats.summary`
- Create: `apps/web/src/components/dashboard/MetricCard.tsx`
- Create: `apps/web/src/components/dashboard/RoleChart.tsx`
- Modify: `apps/web/src/pages/dashboard/DashboardPage.tsx`
- Create: `apps/web/src/__tests__/dashboard.test.tsx`

**Interfaces:**

- Consumes: `GET /api/v1/stats` from Task 1 → `{ userCount, adminCount, managerCount, memberCount }`
- Consumes: `endpoints.stats.summary` string (added in this task)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Install Recharts**

```bash
pnpm --filter web add recharts
```

Expected: `recharts` appears in `apps/web/package.json` dependencies.

- [ ] **Step 2: Add stats endpoint to `apps/web/src/utils/endpoints.ts`**

Replace the entire file with:

```typescript
const base = '/api/v1';

export const endpoints = {
  auth: {
    me: `${base}/users/me`,
    logout: `${base}/auth/logout`,
  },
  users: {
    list: `${base}/users`,
    byId: (id: string) => `${base}/users/${id}`,
    role: (id: string) => `${base}/users/${id}/role`,
  },
  stats: {
    summary: `${base}/stats`,
  },
  onboarding: {
    complete: `${base}/users/me/onboarding/complete`,
  },
};
```

(Adding `onboarding.complete` here so Task 4 can consume it without touching this file again.)

- [ ] **Step 3: Write the failing test**

Create `apps/web/src/__tests__/dashboard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import MetricCard from '../components/dashboard/MetricCard';
import DashboardPage from '../pages/dashboard/DashboardPage';

vi.mock('../utils/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: { userCount: 5, adminCount: 1, managerCount: 1, memberCount: 3 } } }),
  },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../layouts/SidebarLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const memberUser = {
  id: 'u1',
  email: 'member@test.com',
  app_metadata: { role: 'member' },
  user_metadata: { full_name: 'Test Member' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function makeStore(user: typeof memberUser | null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: user as never, status: 'authenticated' as never } },
  });
}

function renderDashboard(user: typeof memberUser | null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore(user)}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total Users" value={42} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(<MetricCard label="Total Users" value={0} isLoading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

describe('DashboardPage — non-admin', () => {
  it('renders four metric cards all showing 0 without calling stats API', () => {
    renderDashboard(memberUser);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText('Users by Role')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
pnpm --filter web exec vitest run src/__tests__/dashboard.test.tsx
```

Expected: FAIL — `MetricCard` not found.

- [ ] **Step 5: Create `apps/web/src/components/dashboard/MetricCard.tsx`**

```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
}

const MetricCard = ({ label, value, description, isLoading = false }: MetricCardProps) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    {isLoading ? (
      <div className="mt-2 h-9 w-24 animate-pulse rounded-md bg-gray-200" />
    ) : (
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    )}
    {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
  </div>
);

export default MetricCard;
```

- [ ] **Step 6: Create `apps/web/src/components/dashboard/RoleChart.tsx`**

```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatsData {
  adminCount: number;
  managerCount: number;
  memberCount: number;
}

interface RoleChartProps {
  data: StatsData | undefined;
  isLoading: boolean;
  isError: boolean;
}

const RoleChart = ({ data, isLoading, isError }: RoleChartProps) => {
  if (isError) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Users by Role</p>
        <p className="mt-4 text-sm text-gray-400">Could not load chart data</p>
      </div>
    );
  }

  const chartData = [
    { role: 'Member', count: data?.memberCount ?? 0 },
    { role: 'Manager', count: data?.managerCount ?? 0 },
    { role: 'Admin', count: data?.adminCount ?? 0 },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-medium text-gray-500">Users by Role</p>
      {isLoading ? (
        <div className="h-[220px] animate-pulse rounded-md bg-gray-200" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="role" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RoleChart;
```

- [ ] **Step 7: Update `apps/web/src/pages/dashboard/DashboardPage.tsx`**

```typescript
import { useAppSelector } from '../../store/hooks';
import { useApiQuery } from '../../hooks/useApiQuery';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import type { ApiSuccess } from '@brainx/shared';
import { ROLE_ADMIN } from '@brainx/shared';
import MetricCard from '../../components/dashboard/MetricCard';
import RoleChart from '../../components/dashboard/RoleChart';

interface StatsData {
  userCount: number;
  adminCount: number;
  managerCount: number;
  memberCount: number;
}

const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.app_metadata?.role === ROLE_ADMIN;

  const { data, isLoading, isError } = useApiQuery<StatsData>(
    ['stats'],
    () =>
      client
        .get<ApiSuccess<StatsData>>(endpoints.stats.summary)
        .then((r) => r.data),
    { staleTime: 60_000, enabled: isAdmin },
  );

  const cards = [
    {
      label: 'Total Users',
      value: isAdmin ? (data?.userCount ?? 0) : 0,
      description: isAdmin ? 'Registered accounts' : undefined,
      isLoading: isAdmin && isLoading,
    },
    {
      label: 'AI Runs',
      value: 0, // TODO: wire to AI workflow run count
    },
    {
      label: 'Files Uploaded',
      value: 0, // TODO: wire to Supabase Storage object count
    },
    {
      label: 'Active Today',
      value: 0, // TODO: wire to session/event log
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">
        Welcome back, {user?.user_metadata?.full_name ?? user?.email}
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {isAdmin && <RoleChart data={data} isLoading={isLoading} isError={isError} />}
    </div>
  );
};

export default DashboardPage;
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm --filter web exec vitest run src/__tests__/dashboard.test.tsx
```

Expected: 3/3 pass.

- [ ] **Step 9: Type-check**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Run full web suite to confirm no regressions**

```bash
pnpm --filter web exec vitest run
```

Expected: all tests pass (previous 5 + 3 new = 8).

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/utils/endpoints.ts \
        apps/web/src/components/dashboard/MetricCard.tsx \
        apps/web/src/components/dashboard/RoleChart.tsx \
        apps/web/src/pages/dashboard/DashboardPage.tsx \
        apps/web/src/__tests__/dashboard.test.tsx \
        apps/web/package.json \
        pnpm-lock.yaml
git commit -m "feat(web): add dashboard metric cards and role distribution chart"
```

---

### Task 3: Onboarding backend — migration, shared schema, service, controller, route

**Files:**

- Create: `supabase/migrations/20260923000001_add_onboarding_completed_at.sql`
- Modify: `packages/shared/src/schemas/profile.ts`
- Create: `apps/api/src/services/onboarding.service.ts`
- Create: `apps/api/src/controllers/onboarding.controller.ts`
- Modify: `apps/api/src/routes/users.routes.ts` — add one route
- Create: `apps/api/src/__tests__/onboarding.test.ts`

**Interfaces:**

- Consumes: `req.user.id` from auth middleware (existing)
- Produces: `PATCH /api/v1/users/me/onboarding/complete` → updated `Profile` with `onboarding_completed_at` set; consumed by Task 5
- Produces: `profileSchema` extended with `onboarding_completed_at: z.string().datetime().nullable()` — consumed by Task 4's `useOnboardingGuard`

Note: the spec lists `onboarding.routes.ts` as a separate file, but since the endpoint path is `/users/me/onboarding/complete` it mounts naturally inside the existing `users.routes.ts` — adding a nested router would create unnecessary indirection. One additional import and one route line in `users.routes.ts` is the ruling here.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/__tests__/onboarding.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { supabaseAdmin } from '../integrations/supabase';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@brainx.io',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockProfile = {
  id: mockUser.id,
  email: mockUser.email,
  full_name: 'Test User',
  avatar_url: null,
  role: 'member',
  onboarding_completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('PATCH /api/v1/users/me/onboarding/complete', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).patch('/api/v1/users/me/onboarding/complete');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with updated profile when authenticated', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    } as never);

    const res = await request(app)
      .patch('/api/v1/users/me/onboarding/complete')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.onboarding_completed_at).toBeTruthy();
  });

  it('returns 500 when Supabase update fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
    } as never);

    const res = await request(app)
      .patch('/api/v1/users/me/onboarding/complete')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UPDATE_FAILED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter api exec vitest run src/__tests__/onboarding.test.ts
```

Expected: FAIL — route not found (404).

- [ ] **Step 3: Create the Supabase migration**

Create `supabase/migrations/20260923000001_add_onboarding_completed_at.sql`:

```sql
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz null;
```

- [ ] **Step 4: Update `packages/shared/src/schemas/profile.ts`**

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  onboarding_completed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
```

- [ ] **Step 5: Create `apps/api/src/services/onboarding.service.ts`**

```typescript
import { supabaseAdmin } from '../integrations/supabase';
import { Profile } from '@brainx/shared';
import { AppError } from '../middleware/error.middleware';

export const completeOnboarding = async (userId: string): Promise<Profile> => {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ onboarding_completed_at: now, updated_at: now })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to complete onboarding', 500, 'UPDATE_FAILED');

  return data as Profile;
};
```

- [ ] **Step 6: Create `apps/api/src/controllers/onboarding.controller.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as OnboardingService from '../services/onboarding.service';

export const completeOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const profile = await OnboardingService.completeOnboarding(req.user!.id);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 7: Add route to `apps/api/src/routes/users.routes.ts`**

Add the import at the top (after existing imports):

```typescript
import * as OnboardingController from '../controllers/onboarding.controller';
```

Add the route after `router.patch('/me', validate(updateProfileSchema), UsersController.updateMe);`:

```typescript
router.patch('/me/onboarding/complete', OnboardingController.completeOnboarding);
```

The relevant section of `users.routes.ts` after the edit:

```typescript
router.use(authenticate);

router.get('/me', UsersController.getMe);
router.patch('/me', validate(updateProfileSchema), UsersController.updateMe);
router.patch('/me/onboarding/complete', OnboardingController.completeOnboarding);

// Admin only
router.get(
  '/',
  authorize([ROLE_ADMIN]),
  validate(paginationSchema, 'query'),
  UsersController.listUsers,
);
router.get('/:id', authorize([ROLE_ADMIN]), UsersController.getUserById);
router.patch(
  '/:id/role',
  authorize([ROLE_ADMIN]),
  validate(updateRoleSchema),
  UsersController.updateUserRole,
);
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
pnpm --filter api exec vitest run src/__tests__/onboarding.test.ts
```

Expected: 3/3 pass.

- [ ] **Step 9: Run full API suite to confirm no regressions**

```bash
pnpm --filter api exec vitest run
```

Expected: 17/19 pass (2 pre-existing `app.test.ts` failures unchanged).

- [ ] **Step 10: Type-check API**

```bash
pnpm --filter api exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/20260923000001_add_onboarding_completed_at.sql \
        packages/shared/src/schemas/profile.ts \
        apps/api/src/services/onboarding.service.ts \
        apps/api/src/controllers/onboarding.controller.ts \
        apps/api/src/routes/users.routes.ts \
        apps/api/src/__tests__/onboarding.test.ts
git commit -m "feat(api): add onboarding complete endpoint and profiles migration"
```

---

### Task 4: Onboarding routing, layout, and guard

**Files:**

- Modify: `apps/web/src/routes/routePaths.ts` — add `onboarding`
- Create: `apps/web/src/layouts/OnboardingLayout.tsx`
- Create: `apps/web/src/hooks/useOnboardingGuard.ts`
- Modify: `apps/web/src/layouts/SidebarLayout.tsx` — call `useOnboardingGuard`
- Modify: `apps/web/src/routes/privateRoutes.tsx` — add optional `layout` prop
- Modify: `apps/web/src/routes/index.tsx` — add `/onboarding` route
- Create: `apps/web/src/__tests__/onboardingGuard.test.tsx`

**Interfaces:**

- Consumes: `endpoints.onboarding.complete` (added in Task 2's endpoints update)
- Consumes: `Profile.onboarding_completed_at` from updated shared schema (Task 3)
- Produces: `/onboarding` route + `OnboardingLayout` + `useOnboardingGuard` hook — consumed by Task 5

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/__tests__/onboardingGuard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';

vi.mock('../hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: vi.fn(),
}));
vi.mock('../layouts/SidebarLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar">{children}</div>,
}));

import { useOnboardingGuard } from '../hooks/useOnboardingGuard';
import PrivateRoute from '../routes/privateRoutes';

const authenticatedUser = {
  id: 'u1',
  email: 'user@test.com',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: authenticatedUser as never, status: 'authenticated' as never } },
  });
}

function renderRoute(layout?: React.ComponentType<{ children: React.ReactNode }>) {
  const qc = new QueryClient();
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute layout={layout}>
                  <div data-testid="content">Content</div>
                </PrivateRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('PrivateRoute layout prop', () => {
  it('renders SidebarLayout by default', () => {
    vi.mocked(useOnboardingGuard).mockReturnValue(undefined);
    renderRoute();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders custom layout when provided', () => {
    vi.mocked(useOnboardingGuard).mockReturnValue(undefined);
    const CustomLayout = ({ children }: { children: React.ReactNode }) => (
      <div data-testid="custom-layout">{children}</div>
    );
    renderRoute(CustomLayout);
    expect(screen.getByTestId('custom-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter web exec vitest run src/__tests__/onboardingGuard.test.tsx
```

Expected: FAIL — `useOnboardingGuard` module not found.

- [ ] **Step 3: Add `onboarding` to `apps/web/src/routes/routePaths.ts`**

```typescript
export const ROUTES = {
  login: '/',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  unauthorized: '/unauthorized',
  dashboard: '/dashboard',
  profile: '/profile',
  users: '/users',
  onboarding: '/onboarding',
  authCallback: '/auth/callback',
} as const;
```

- [ ] **Step 4: Create `apps/web/src/layouts/OnboardingLayout.tsx`**

```typescript
interface OnboardingLayoutProps {
  children: React.ReactNode;
}

const OnboardingLayout = ({ children }: OnboardingLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">{children}</div>
);

export default OnboardingLayout;
```

- [ ] **Step 5: Create `apps/web/src/hooks/useOnboardingGuard.ts`**

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiSuccess, Profile } from '@brainx/shared';
import { useApiQuery } from './useApiQuery';
import client from '../utils/client';
import { endpoints } from '../utils/endpoints';
import { ROUTES } from '../routes/routePaths';

export const useOnboardingGuard = () => {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useApiQuery<Profile>(['profile', 'me'], () =>
    client.get<ApiSuccess<Profile>>(endpoints.auth.me).then((r) => r.data),
  );

  useEffect(() => {
    if (!isLoading && profile && profile.onboarding_completed_at === null) {
      navigate(ROUTES.onboarding, { replace: true });
    }
  }, [isLoading, profile, navigate]);
};
```

- [ ] **Step 6: Update `apps/web/src/layouts/SidebarLayout.tsx`**

Add the import after the existing imports:

```typescript
import { useOnboardingGuard } from '../hooks/useOnboardingGuard';
```

Call the hook as the first line inside the `SidebarLayout` component body (before `useState`):

```typescript
const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  useOnboardingGuard();
  const [collapsed, setCollapsed] = useState(false);
  // ... rest unchanged
```

- [ ] **Step 7: Update `apps/web/src/routes/privateRoutes.tsx`** to accept an optional `layout` prop

Replace the entire file with:

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './routePaths';
import { useAppSelector } from '../store/hooks';
import SidebarLayout from '../layouts/SidebarLayout';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
}

const PrivateRoute = ({
  children,
  requiredRole,
  layout: Layout = SidebarLayout,
}: PrivateRouteProps) => {
  const status = useAppSelector((state) => state.auth.status);
  const role = useAppSelector(
    (state) => state.auth.user?.app_metadata?.role as string | undefined,
  );
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={`${ROUTES.login}?redirect=${location.pathname}`} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={ROUTES.unauthorized} replace />;
  }

  return <Layout>{children}</Layout>;
};

export default PrivateRoute;
```

- [ ] **Step 8: Update `apps/web/src/routes/index.tsx`** to add the onboarding route

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PublicRouteList, PrivateRouteList, NotFoundPage } from './routeMapper';
import PublicRoute from './publicRoutes';
import PrivateRoute from './privateRoutes';
import PublicLayout from '../layouts/PublicLayout';
import OnboardingLayout from '../layouts/OnboardingLayout';
import { ROUTES } from './routePaths';

const OnboardingPage = lazy(() => import('../pages/onboarding/OnboardingPage'));

const Loader = () => (
  <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>
);

const RouteConfig = () => (
  <BrowserRouter>
    <Suspense fallback={<Loader />}>
      <Routes>
        {PublicRouteList.map(({ path, component: Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <PublicRoute>
                <PublicLayout>
                  <Component />
                </PublicLayout>
              </PublicRoute>
            }
          />
        ))}

        {PrivateRouteList.map(({ path, component: Component, requiredRole }) => (
          <Route
            key={path}
            path={path}
            element={
              <PrivateRoute requiredRole={requiredRole}>
                <Component />
              </PrivateRoute>
            }
          />
        ))}

        <Route
          path={ROUTES.onboarding}
          element={
            <PrivateRoute layout={OnboardingLayout}>
              <OnboardingPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default RouteConfig;
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pnpm --filter web exec vitest run src/__tests__/onboardingGuard.test.tsx
```

Expected: 2/2 pass.

- [ ] **Step 10: Type-check**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Run full web suite**

```bash
pnpm --filter web exec vitest run
```

Expected: all tests pass.

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/routes/routePaths.ts \
        apps/web/src/layouts/OnboardingLayout.tsx \
        apps/web/src/hooks/useOnboardingGuard.ts \
        apps/web/src/layouts/SidebarLayout.tsx \
        apps/web/src/routes/privateRoutes.tsx \
        apps/web/src/routes/index.tsx \
        apps/web/src/__tests__/onboardingGuard.test.tsx
git commit -m "feat(web): add onboarding routing, layout, and guard hook"
```

---

### Task 5: OnboardingPage — 3-step wizard

**Files:**

- Create: `apps/web/src/pages/onboarding/OnboardingPage.tsx`
- Create: `apps/web/src/__tests__/onboardingPage.test.tsx`

**Interfaces:**

- Consumes: `endpoints.auth.me` (GET — fetch profile for pre-fill and completed check)
- Consumes: `endpoints.auth.me` (PATCH — save `full_name` in step 1)
- Consumes: `endpoints.onboarding.complete` (PATCH — mark done)
- Consumes: `ROUTES.dashboard`, `ROUTES.onboarding`
- Consumes: `['profile', 'me']` TanStack Query key (invalidated on complete)
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/__tests__/onboardingPage.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import OnboardingPage from '../pages/onboarding/OnboardingPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockGet = vi.fn();
const mockPatch = vi.fn();
vi.mock('../utils/client', () => ({
  default: { get: mockGet, patch: mockPatch },
  get: vi.fn(),
  post: vi.fn(),
  patch: mockPatch,
  put: vi.fn(),
  del: vi.fn(),
}));

const profileWithoutOnboarding = {
  id: 'u1',
  email: 'user@test.com',
  full_name: null,
  avatar_url: null,
  role: 'member',
  onboarding_completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function setup() {
  mockGet.mockResolvedValue({
    data: { success: true, data: profileWithoutOnboarding },
  });
  mockPatch.mockResolvedValue({
    data: { success: true, data: { ...profileWithoutOnboarding, onboarding_completed_at: new Date().toISOString() } },
  });

  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { id: 'u1', email: 'user@test.com', app_metadata: { role: 'member' }, user_metadata: {}, aud: 'authenticated', created_at: '' } as never,
        status: 'authenticated' as never,
      },
    },
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('OnboardingPage', () => {
  it('renders step 1 with Continue disabled when name is empty', async () => {
    setup();
    await screen.findByText('Set up your profile');
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it('enables Continue when name is entered', async () => {
    setup();
    await screen.findByText('Set up your profile');
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Alice' },
    });
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('shows step 2 after step 1 Continue', async () => {
    setup();
    await screen.findByText('Set up your profile');
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Alice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText('Explore the dashboard');
  });

  it('Skip for now on step 2 calls complete and navigates to dashboard', async () => {
    setup();
    await screen.findByText('Set up your profile');
    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Alice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText('Explore the dashboard');
    fireEvent.click(screen.getByText('Skip for now'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter web exec vitest run src/__tests__/onboardingPage.test.tsx
```

Expected: FAIL — `OnboardingPage` module not found.

- [ ] **Step 3: Create `apps/web/src/pages/onboarding/OnboardingPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ApiSuccess, Profile } from '@brainx/shared';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import { ROUTES } from '../../routes/routePaths';

const STEPS = 3;

interface FeatureTileProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureTile = ({ icon, title, description }: FeatureTileProps) => (
  <div className="flex gap-3 rounded-xl border border-gray-100 p-4">
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useApiQuery<Profile>(
    ['profile', 'me'],
    () =>
      client
        .get<ApiSuccess<Profile>>(endpoints.auth.me)
        .then((r) => r.data),
  );

  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.onboarding_completed_at !== null) {
        navigate(ROUTES.dashboard, { replace: true });
        return;
      }
      setFullName(profile.full_name ?? '');
    }
  }, [profileLoading, profile, navigate]);

  const updateProfileMutation = useApiMutation<Profile, { full_name: string }>(
    (vars) =>
      client
        .patch<ApiSuccess<Profile>>(endpoints.auth.me, vars)
        .then((r) => r.data),
    { errorMessage: 'Failed to save name' },
  );

  const completeMutation = useApiMutation<Profile, void>(
    () =>
      client
        .patch<ApiSuccess<Profile>>(endpoints.onboarding.complete)
        .then((r) => r.data),
    {
      errorMessage: 'Failed to complete onboarding — please try again',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        navigate(ROUTES.dashboard, { replace: true });
      },
    },
  );

  const handleStep1Next = async () => {
    if (!fullName.trim()) return;
    try {
      await updateProfileMutation.mutateAsync({ full_name: fullName.trim() });
      setStep(2);
    } catch {
      // toast already shown by useApiMutation onError
    }
  };

  const handleSkip = () => completeMutation.mutate();
  const handleComplete = () => completeMutation.mutate();

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
      {/* Progress dots */}
      <div className="mb-8 flex justify-center gap-2">
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i + 1 === step
                ? 'bg-brand-600'
                : i + 1 < step
                  ? 'bg-brand-300'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <h1 className="mb-1 text-xl font-bold text-gray-900">Set up your profile</h1>
          <p className="mb-6 text-sm text-gray-500">How should we call you?</p>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleStep1Next}
            disabled={!fullName.trim() || updateProfileMutation.isPending}
            className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {updateProfileMutation.isPending ? 'Saving…' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h1 className="mb-1 text-xl font-bold text-gray-900">Explore the dashboard</h1>
          <p className="mb-6 text-sm text-gray-500">Here's what's ready for you.</p>
          <div className="space-y-3">
            <FeatureTile
              icon="📊"
              title="Metrics"
              description="Live user stats and role distribution at a glance."
            />
            <FeatureTile
              icon="👥"
              title="User management"
              description="Invite teammates and manage roles from the Users page."
            />
            <FeatureTile
              icon="🤖"
              title="AI agents"
              description="Plug in your own agents via the pre-wired abstraction layer."
            />
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Next
            </button>
          </div>
          <button
            onClick={handleSkip}
            disabled={completeMutation.isPending}
            className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="text-center">
          <p className="mb-2 text-4xl">🎉</p>
          <h1 className="mb-1 text-xl font-bold text-gray-900">You're all set!</h1>
          <p className="mb-8 text-sm text-gray-500">
            Your workspace is ready. Let's build something great.
          </p>
          <button
            onClick={handleComplete}
            disabled={completeMutation.isPending}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {completeMutation.isPending ? 'Loading…' : 'Go to Dashboard'}
          </button>
          <button
            onClick={() => setStep(2)}
            className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSkip}
            disabled={completeMutation.isPending}
            className="mt-1 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter web exec vitest run src/__tests__/onboardingPage.test.tsx
```

Expected: 4/4 pass.

- [ ] **Step 5: Type-check**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run full web suite**

```bash
pnpm --filter web exec vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Run full API suite**

```bash
pnpm --filter api exec vitest run
```

Expected: 17/19 pass (2 pre-existing failures unchanged).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/onboarding/OnboardingPage.tsx \
        apps/web/src/__tests__/onboardingPage.test.tsx
git commit -m "feat(web): add 3-step onboarding wizard"
```
