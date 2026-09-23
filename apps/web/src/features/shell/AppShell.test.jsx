import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { AppShell } from './AppShell.jsx';

describe('AppShell', () => {
  it('renders the sidebar, header, and outlet content together', () => {
    renderWithProviders(null, {
      authStatus: 'authenticated',
      routes: [
        { element: <AppShell />, children: [{ index: true, element: <div>Child content</div> }] },
      ],
    });

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('contains no auth-guard logic (ADR-4): no useAuth import, no <Navigate>', () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, './AppShell.jsx'), 'utf8');
    expect(source).not.toContain('useAuth');
    expect(source).not.toContain('Navigate');
  });
});
