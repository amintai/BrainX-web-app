# Dashboard Metrics — Design Spec

**Status:** approved  
**Date:** 2026-09-23  
**Feature area:** Dashboard

---

## Goal

Replace the empty `DashboardPage` with four metric cards and a role-distribution bar chart. One card and the chart pull live data from a new `/api/v1/stats` endpoint; the other three cards are static placeholders with explicit `// TODO` hooks for teams to wire into their own metrics.

## Acceptance Criteria

### Backend

**FR-DASH-001** — `GET /api/v1/stats` exists and is mounted at `/api/v1/stats`.

**FR-DASH-002** — The endpoint requires a valid JWT (auth middleware). It is restricted to the `admin` role via `authorize([ROLE_ADMIN])`.

**FR-DASH-003** — The response conforms to the standard success envelope:

```json
{
  "success": true,
  "data": {
    "userCount": 12,
    "adminCount": 2,
    "managerCount": 3,
    "memberCount": 7
  }
}
```

**FR-DASH-004** — Counts are derived from `profiles` via Supabase. `userCount` equals `adminCount + managerCount + memberCount`.

**FR-DASH-005** — If the Supabase query fails the endpoint returns `{ success: false, error: { code: "FETCH_FAILED", message: "..." } }` with HTTP 500.

### Frontend — MetricCard

**FR-DASH-006** — `MetricCard` accepts `{ label: string; value: string | number; description?: string; isLoading?: boolean }` and renders a white rounded card with a label, large value, and optional description line.

**FR-DASH-007** — When `isLoading` is true the value area renders a grey animated pulse skeleton instead of the number.

**FR-DASH-008** — Four cards are rendered in a 2×2 responsive grid on the dashboard:

- **Total Users** — value from `data.userCount` (live)
- **AI Runs** — static `0` with comment `// TODO: wire to AI workflow run count`
- **Files Uploaded** — static `0` with comment `// TODO: wire to Supabase Storage object count`
- **Active Today** — static `0` with comment `// TODO: wire to session/event log`

### Frontend — RoleChart

**FR-DASH-009** — `RoleChart` renders a Recharts `BarChart` with three bars (Member, Manager, Admin) using data from `GET /api/v1/stats`.

**FR-DASH-010** — While loading, the chart area shows a skeleton placeholder of the same height. On error, it shows "Could not load chart data" inline.

**FR-DASH-011** — The chart is responsive (`ResponsiveContainer width="100%" height={220}`).

### Frontend — Data fetching

**FR-DASH-012** — Stats are fetched with `useApiQuery(['stats'], ...)` with `staleTime: 60_000`. Non-admin users (who cannot call `/api/v1/stats`) see all cards with static zeros and no chart — no error toast.

**FR-DASH-013** — `endpoints.stats.summary` is added to `apps/web/src/utils/endpoints.ts`.

## Tech constraints

- Chart library: `recharts` installed in `apps/web`
- No new shared package types needed — stats shape is API-local
- Follows existing `useApiQuery` / `client` / response envelope patterns
- `MetricCard` and `RoleChart` live in `apps/web/src/components/dashboard/`

## Out of scope

- Real-time auto-refresh (stale time of 60 s is sufficient)
- Click-through / drill-down from cards
- Date range filtering
