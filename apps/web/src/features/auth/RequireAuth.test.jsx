import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { RequireAuth } from './RequireAuth.jsx';
import { AuthContext } from './AuthProvider.jsx';

function renderWithStatus(status) {
  return render(
    <AuthContext.Provider value={{ session: null, user: null, status }}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<div>Protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('redirects to /login and renders no protected content when unauthenticated', () => {
    renderWithStatus('unauthenticated');
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    renderWithStatus('authenticated');
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('LoginPage validation', () => {
  it('shows a Zod-derived error and never calls signInWithPassword for an invalid email', async () => {
    vi.resetModules();
    vi.doMock('../../lib/supabase.js', () => ({
      supabase: { auth: { signInWithPassword: vi.fn() } },
    }));

    const { LoginPage } = await import('./LoginPage.jsx');
    const { supabase } = await import('../../lib/supabase.js');

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Work Email');
    const submitButton = screen.getByRole('button', { name: /enter brainx workspace/i });

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);
    fireEvent.click(submitButton);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});
