import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import OnboardingPage from '../pages/onboarding/OnboardingPage';

const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
  mockPatch: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
}));

vi.mock('../utils/client', () => ({
  default: { get: mockGet, patch: mockPatch },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: vi.fn(),
}));

const authedUser = {
  id: 'u1',
  email: 'test@test.com',
  app_metadata: { role: 'member' },
  user_metadata: { full_name: '' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: authedUser as never, status: 'authenticated' as never } },
  });
}

function renderOnboarding() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: { success: true, data: {} } });
    mockPatch.mockResolvedValue({ data: { success: true, data: {} } });
  });

  it('renders step 1 — Profile Setup — by default', () => {
    renderOnboarding();
    expect(screen.getByText(/profile setup/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('advances to step 2 after filling name and clicking Next', async () => {
    renderOnboarding();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(screen.getByText(/explore features/i)).toBeInTheDocument());
  });

  it('shows step 3 — All Set — after completing step 2', async () => {
    renderOnboarding();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByText(/explore features/i));
    fireEvent.click(screen.getAllByRole('button', { name: /^next$/i })[0]);
    await waitFor(() => expect(screen.getByText(/all set/i)).toBeInTheDocument());
  });

  it('calls complete endpoint when Go to Dashboard is clicked on step 3', async () => {
    renderOnboarding();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByText(/explore features/i));
    fireEvent.click(screen.getAllByRole('button', { name: /^next$/i })[0]);
    await waitFor(() => screen.getByText(/all set/i));
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(expect.stringContaining('/onboarding/complete')),
    );
  });
});
