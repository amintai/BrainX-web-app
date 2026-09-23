import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import SettingsPage from '../pages/settings/SettingsPage';

const { mockDel, mockShowToastSuccess, mockShowToastError, mockUpdateUser, mockSignOut } =
  vi.hoisted(() => ({
    mockDel: vi.fn().mockResolvedValue({ data: { success: true } }),
    mockShowToastSuccess: vi.fn(),
    mockShowToastError: vi.fn(),
    mockUpdateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    mockSignOut: vi.fn().mockResolvedValue({ error: null }),
  }));

vi.mock('../utils/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: mockDel,
  },
}));

vi.mock('../utils/common', () => ({
  showToastSuccess: mockShowToastSuccess,
  showToastError: mockShowToastError,
}));

vi.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.mock('../hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: vi.fn(),
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

const authedUser = {
  id: 'u1',
  email: 'test@example.com',
  app_metadata: { role: 'member' },
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

function wrap(ui: React.ReactNode) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: authedUser as never, status: 'authenticated' as never },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    mockDel.mockResolvedValue({ data: { success: true } });
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('renders Appearance, Password, and Danger Zone sections', () => {
    wrap(<SettingsPage />);
    expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^password$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /danger zone/i })).toBeInTheDocument();
  });

  it('shows password mismatch error without submitting', async () => {
    wrap(<SettingsPage />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument());
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls supabase.auth.updateUser on valid password change', async () => {
    wrap(<SettingsPage />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword123' }),
    );
  });

  it('keeps Confirm Delete button disabled until email matches', () => {
    wrap(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    expect(confirmBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/type your email/i), {
      target: { value: 'wrong@example.com' },
    });
    expect(confirmBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/type your email/i), {
      target: { value: 'test@example.com' },
    });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls DELETE /users/me and signOut on confirmed account deletion', async () => {
    wrap(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    fireEvent.change(screen.getByPlaceholderText(/type your email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
    await waitFor(() => expect(mockDel).toHaveBeenCalled());
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  });
});
