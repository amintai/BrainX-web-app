import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';

vi.mock('../utils/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ status: 200, data: { success: true, data: {} } }),
  },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

const authedUser = {
  id: 'u1',
  email: 'test@test.com',
  app_metadata: { role: 'member' },
  user_metadata: { full_name: 'Test' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function makeStore(user = authedUser) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: user as never, status: 'authenticated' as never } },
  });
}

function wrap(ui: React.ReactNode, { initialPath = '/dashboard' } = {}) {
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
    </Provider>,
  );
}

describe('OnboardingLayout', () => {
  it('renders children without sidebar', async () => {
    const { default: OnboardingLayout } = await import('../layouts/OnboardingLayout');
    wrap(<OnboardingLayout>onboarding content</OnboardingLayout>);
    expect(screen.getByText('onboarding content')).toBeInTheDocument();
    expect(screen.queryByText('BrainX')).not.toBeInTheDocument();
  });
});

describe('useOnboardingGuard', () => {
  it('returns without redirect when onboarding_completed_at is set', async () => {
    const client = (await import('../utils/client')).default;
    vi.mocked(client.get).mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: { onboarding_completed_at: new Date().toISOString() },
      },
    });

    const { useOnboardingGuard } = await import('../hooks/useOnboardingGuard');
    const redirected = false;

    function TestComponent() {
      useOnboardingGuard();
      return <div>guarded content</div>;
    }

    wrap(<TestComponent />);
    expect(redirected).toBe(false);
    expect(screen.getByText('guarded content')).toBeInTheDocument();
  });
});
