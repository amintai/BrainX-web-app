import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { RoleBreakdownCard } from './RoleBreakdownCard.jsx';

describe('RoleBreakdownCard', () => {
  it('shows the legend with counts/percents in fixture order and a valid capital-B viewBox', async () => {
    const { container } = renderWithProviders(<RoleBreakdownCard />, {
      authStatus: 'authenticated',
    });

    await screen.findByText('Admins');
    const rows = [...container.querySelectorAll('.bg-surface-container-low')].map(
      (row) => row.textContent,
    );
    expect(rows[0]).toContain('Admins');
    expect(rows[0]).toContain('285');
    expect(rows[0]).toContain('10%');
    expect(rows[1]).toContain('Editors');
    expect(rows[1]).toContain('853');
    expect(rows[1]).toContain('30%');
    expect(rows[2]).toContain('Viewers');
    expect(rows[2]).toContain('1,707');
    expect(rows[2]).toContain('60%');

    const svg = container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
  });
});
