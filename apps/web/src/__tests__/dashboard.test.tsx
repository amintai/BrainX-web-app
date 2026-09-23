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
    get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: { userCount: 5, adminCount: 1, managerCount: 1, memberCount: 3 },
      },
    }),
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

vi.mock('../hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: vi.fn(),
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
  it('renders four metric cards all showing 0 without showing chart', () => {
    renderDashboard(memberUser);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText('Users by Role')).not.toBeInTheDocument();
  });
});
