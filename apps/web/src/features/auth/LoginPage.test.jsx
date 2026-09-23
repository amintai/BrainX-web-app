import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../lib/supabase.js', () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}));

import { supabase } from '../../lib/supabase.js';
import { LoginPage } from './LoginPage.jsx';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls signInWithPassword with exactly { email, password } — never a remember field', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Work Email'), {
      target: { value: 'deepti.jakhotra@tntra.io' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /enter brainx workspace/i }));

    await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1));
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'deepti.jakhotra@tntra.io',
      password: 'super-secret',
    });
  });

  it('toggles the password field type and icon', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: 'Show password' });
    fireEvent.click(toggle);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('still shows the unchanged loginSchema error for an invalid email', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Work Email');
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('disables the submit button and sets aria-busy while submitting', async () => {
    let resolveSignIn;
    supabase.auth.signInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Work Email'), {
      target: { value: 'deepti.jakhotra@tntra.io' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } });

    const submitButton = screen.getByRole('button', { name: /enter brainx workspace/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveAttribute('aria-busy', 'true');

    resolveSignIn({ error: null });
  });
});
