import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsersPageHeader } from './UsersPageHeader.jsx';

describe('UsersPageHeader', () => {
  it('renders the breadcrumb, title, and description', () => {
    render(<UsersPageHeader />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument();
    expect(screen.getByText(/Manage team members, roles, permissions/)).toBeInTheDocument();
  });
});
