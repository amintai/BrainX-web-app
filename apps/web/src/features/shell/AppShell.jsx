import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar.jsx';
import { TopHeader } from './TopHeader.jsx';

/**
 * Authenticated-area chrome (FR-008, FR-012, FR-013). No auth-guard logic
 * of its own (ADR-4) — `RequireAuth` gates before this ever mounts.
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="pl-64">
        <TopHeader />
        <main className="relative pt-16 bg-surface w-full min-h-screen px-gutter-lg py-gutter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
