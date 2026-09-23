import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './renderWithProviders.jsx';

describe('renderWithProviders smoke test', () => {
  it('renders without throwing when authenticated', () => {
    renderWithProviders(<div>ok</div>, { authStatus: 'authenticated' });
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('renders without throwing when unauthenticated', () => {
    renderWithProviders(<div>ok</div>, { authStatus: 'unauthenticated' });
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
