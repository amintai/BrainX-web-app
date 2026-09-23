import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import AvatarUpload from '../components/profile/AvatarUpload';

const { mockPost, mockShowToastError, mockRefresh } = vi.hoisted(() => ({
  mockPost: vi.fn().mockResolvedValue({
    status: 200,
    data: { success: true, data: { avatar_url: 'https://example.com/new.jpg' } },
  }),
  mockShowToastError: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('../utils/client', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: mockPost,
    put: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('../utils/common', () => ({
  showToastSuccess: vi.fn(),
  showToastError: mockShowToastError,
}));

vi.mock('../hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: vi.fn(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    status: 'authenticated',
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    refresh: mockRefresh,
  }),
}));

function wrap(ui: React.ReactNode) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null as never,
        status: 'authenticated' as never,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
}

describe('AvatarUpload', () => {
  it('renders initials when no avatar URL provided', () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders an img when avatar URL is provided', () => {
    wrap(<AvatarUpload currentUrl="https://example.com/avatar.jpg" initials="JD" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('shows toast error and does not upload when file type is invalid', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new ArrayBuffer(100)], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mockShowToastError).toHaveBeenCalled());
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows toast error and does not upload when file exceeds 2 MB', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'big.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(input, { target: { files: [bigFile] } });
    await waitFor(() => expect(mockShowToastError).toHaveBeenCalled());
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls POST /users/me/avatar with FormData on valid file selection', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new ArrayBuffer(100)], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    const [url, formData, config] = mockPost.mock.calls[0];
    expect(url).toContain('/users/me/avatar');
    expect(formData).toBeInstanceOf(FormData);
    expect(config?.headers?.['Content-Type']).toBe('multipart/form-data');
  });

  it('calls refresh() after a successful upload so Redux auth state reflects the new avatar', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new ArrayBuffer(100)], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
