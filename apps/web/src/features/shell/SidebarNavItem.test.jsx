import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { SidebarNavItem } from './SidebarNavItem.jsx';

const dashboardItem = { key: 'dashboard', label: 'Dashboard', icon: 'home', to: '/', end: true };

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<SidebarNavItem item={dashboardItem} />} />
        <Route path="/users" element={<SidebarNavItem item={dashboardItem} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SidebarNavItem', () => {
  it('marks the item active with aria-current at its own route', () => {
    renderAt('/');
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('has no aria-current on a different route', () => {
    renderAt('/users');
    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(
      <SidebarNavItem
        item={{ key: 'logout', label: 'Logout', icon: 'logout' }}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('is inert with no handler and aria-disabled when neither to nor onSelect is given', () => {
    render(<SidebarNavItem item={{ key: 'analytics', label: 'Analytics', icon: 'bar_chart' }} />);
    const button = screen.getByRole('button', { name: /analytics/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});
