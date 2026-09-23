import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { RedirectIfAuthenticated } from './RedirectIfAuthenticated.jsx';
import { AuthContext } from './AuthProvider.jsx';

function renderWithStatus(status) {
  return render(
    <AuthContext.Provider value={{ session: null, user: null, status }}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/login" element={<div>Login page</div>} />
          </Route>
          <Route path="/" element={<div>Dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RedirectIfAuthenticated', () => {
  it('redirects to / when authenticated', () => {
    renderWithStatus('authenticated');
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('renders the login outlet when unauthenticated', () => {
    renderWithStatus('unauthenticated');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    const { container } = renderWithStatus('loading');
    expect(container).toBeEmptyDOMElement();
  });
});
