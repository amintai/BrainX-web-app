import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserTable } from './UserTable.jsx';

const sample = [
  {
    id: '1',
    name: 'Marcus Vance',
    email: 'm.vance@nexus-corp.internal',
    role: 'administrator',
    status: 'active',
    avatarUrl: null,
  },
  {
    id: '2',
    name: 'Elena Rostova',
    email: 'e.rostova@nexus-corp.internal',
    role: 'manager',
    status: 'active',
    avatarUrl: null,
  },
  {
    id: '3',
    name: 'Chloe Chen',
    email: 'c.chen@nexus-corp.internal',
    role: 'member',
    status: 'pending',
    avatarUrl: null,
  },
];

describe('UserTable', () => {
  it('renders a row per user with avatar/name/email, role badge, and status badge', () => {
    render(<UserTable users={sample} />);
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('m.vance@nexus-corp.internal')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('shows the empty-state message for zero rows', () => {
    render(<UserTable users={[]} />);
    expect(screen.getByText('No users match your search.')).toBeInTheDocument();
  });

  it('applies the hover utility class on rows', () => {
    const { container } = render(<UserTable users={sample} />);
    const row = container.querySelector('tbody tr');
    expect(row.className).toContain('hover:bg-surface-container-low/70');
  });
});
