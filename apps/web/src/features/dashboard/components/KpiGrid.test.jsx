import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { KpiGrid } from './KpiGrid.jsx';

describe('KpiGrid', () => {
  it('renders 4 skeleton placeholders before the query resolves', () => {
    const { container } = renderWithProviders(<KpiGrid />, { authStatus: 'authenticated' });
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('renders 4 stat cards with their documented footer content once resolved', async () => {
    renderWithProviders(<KpiGrid />, { authStatus: 'authenticated' });

    expect(await screen.findByText('Total Active Users')).toBeInTheDocument();
    expect(screen.getByText('+12.4%')).toBeInTheDocument();
    expect(screen.getByText('255 allocated')).toBeInTheDocument();
    expect(screen.getByText('300 total')).toBeInTheDocument();
    expect(screen.getByText('All systems nominal')).toBeInTheDocument();
    expect(screen.getByText('Requires review')).toBeInTheDocument();
  });
});
