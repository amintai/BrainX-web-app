import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from './Pagination.jsx';

describe('Pagination', () => {
  it('shows the range summary and disables Prev on page 1', () => {
    render(
      <Pagination
        page={1}
        pageSize={10}
        total={24}
        itemLabel="users"
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1-10 of 24 users');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows a zero summary when there are no results', () => {
    render(
      <Pagination
        page={1}
        pageSize={10}
        total={0}
        itemLabel="users"
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 0-0 of 0 users');
  });
});
