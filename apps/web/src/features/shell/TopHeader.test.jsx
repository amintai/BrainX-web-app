import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { TopHeader } from './TopHeader.jsx';

describe('TopHeader', () => {
  it('search input and bell trigger no query activity and open no menu', () => {
    const { queryClient } = renderWithProviders(<TopHeader />, { authStatus: 'authenticated' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery');

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'marcus' } });
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
