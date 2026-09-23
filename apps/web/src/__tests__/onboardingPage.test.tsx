import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import OnboardingPage from '../pages/onboarding/OnboardingPage';

const { mockGet, mockPatch, mockShowToastError } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
  mockShowToastError: vi.fn(),
}));

vi.mock('../utils/client', () => ({
  default: { get: mockGet, patch: mockPatch },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../utils/common', () => ({
  showToastSuccess: vi.fn(),
  showToastError: mockShowToastError,
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
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    </Provider>,
  );
}

async function advanceToStep2() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
  await waitFor(() => screen.getByText(/explore features/i));
}

async function advanceToStep3() {
  await advanceToStep2();
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
  await waitFor(() => screen.getByText(/all set/i));
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ status: 200, data: { success: true, data: { full_name: null } } });
    mockPatch.mockResolvedValue({ status: 200, data: { success: true, data: {} } });
    mockShowToastError.mockReset();
  });

  it('renders step 1 — Profile Setup — by default', () => {
    renderOnboarding();
    expect(screen.getByText(/profile setup/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('pre-fills full name from profile when available', async () => {
    mockGet.mockResolvedValue({
      status: 200,
      data: { success: true, data: { full_name: 'Existing Name' } },
    });
    renderOnboarding();
    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>(/full name/i).value).toBe('Existing Name'),
    );
  });

  it('advances to step 2 after filling name and clicking Next', async () => {
    renderOnboarding();
    await advanceToStep2();
    expect(screen.getByText(/explore features/i)).toBeInTheDocument();
  });

  it('shows toast error when name save PATCH fails', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Network error'));
    renderOnboarding();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(mockShowToastError).toHaveBeenCalled());
    expect(screen.getByText(/profile setup/i)).toBeInTheDocument();
  });

  it('step-2 Skip calls complete endpoint (not just advance step)', async () => {
    renderOnboarding();
    await advanceToStep2();
    fireEvent.click(screen.getByRole('button', { name: /^skip/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(expect.stringContaining('/onboarding/complete')),
    );
  });

  it('shows step 3 — All Set — after clicking Next on step 2', async () => {
    renderOnboarding();
    await advanceToStep3();
    expect(screen.getByText(/all set/i)).toBeInTheDocument();
  });

  it('navigates to dashboard after complete so guard does not loop', async () => {
    renderOnboarding();
    await advanceToStep3();
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(expect.stringContaining('/onboarding/complete')),
    );
  });

  it('shows toast error when complete PATCH fails', async () => {
    renderOnboarding();
    await advanceToStep3();
    mockPatch.mockRejectedValueOnce(new Error('Network error'));
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
    await waitFor(() => expect(mockShowToastError).toHaveBeenCalled());
    expect(screen.getByText(/all set/i)).toBeInTheDocument();
  });
});
