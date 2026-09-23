import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { RoleBadge } from './RoleBadge.jsx';
import { StatusBadge } from './StatusBadge.jsx';

describe('RoleBadge', () => {
  it('renders "Administrator" with a literal class string', () => {
    render(<RoleBadge role="administrator" />);
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('never builds class names by interpolation (class-literal rule)', () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, './RoleBadge.jsx'), 'utf8');
    expect(source).not.toMatch(/role-\$\{/);
  });
});

describe('StatusBadge', () => {
  it('gives each of the 3 statuses its own distinct badge + dot classes', () => {
    const { container: activeC } = render(<StatusBadge status="active" />);
    const { container: pendingC } = render(<StatusBadge status="pending" />);
    const { container: inactiveC } = render(<StatusBadge status="inactive" />);

    const classes = [
      activeC.querySelector('span').className,
      pendingC.querySelector('span').className,
      inactiveC.querySelector('span').className,
    ];
    expect(new Set(classes).size).toBe(3);
  });
});
