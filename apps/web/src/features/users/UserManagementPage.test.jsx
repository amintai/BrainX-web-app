import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { UserManagementPage } from './UserManagementPage.jsx';

describe('UserManagementPage', () => {
  it('searches, resets to page 1, paginates, and updates the summary text', async () => {
    renderWithProviders(<UserManagementPage />, { authStatus: 'authenticated' });

    await screen.findByText('Marcus Vance');
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1-10 of 24 users');

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 11-20 of 24 users'),
    );

    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'marcus' } });
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1-1 of 1 users'),
    );
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.queryByText('Elena Rostova')).not.toBeInTheDocument();
  });

  it('changing rows per page shows more rows and resets to page 1', async () => {
    renderWithProviders(<UserManagementPage />, { authStatus: 'authenticated' });
    await screen.findByText('Marcus Vance');

    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '25' } });
    await waitFor(() =>
      expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1-24 of 24 users'),
    );
  });

  it('disables Prev on page 1 and Next on the last page', async () => {
    renderWithProviders(<UserManagementPage />, { authStatus: 'authenticated' });
    await screen.findByText('Marcus Vance');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled());
  });
});
