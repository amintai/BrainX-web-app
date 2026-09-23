import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { OnboardingChecklist } from './OnboardingChecklist.jsx';

describe('OnboardingChecklist', () => {
  it('starts at 2 of 4 done / 50%, toggles items, and reverses on a second click', async () => {
    renderWithProviders(<OnboardingChecklist />, { authStatus: 'authenticated' });

    expect(await screen.findByText('2 of 4 done')).toBeInTheDocument();
    expect(screen.getByText('50% completed')).toBeInTheDocument();

    const pendingRowText = screen.getByText('Set Granular Role-Based Permissions');
    const row = pendingRowText.closest('div[class*="cursor-pointer"]');
    fireEvent.click(row);

    expect(await screen.findByText('3 of 4 done')).toBeInTheDocument();
    expect(screen.getByText('75% completed')).toBeInTheDocument();

    fireEvent.click(row);
    expect(await screen.findByText('2 of 4 done')).toBeInTheDocument();
  });

  it('does not toggle when the trailing action button is clicked', async () => {
    renderWithProviders(<OnboardingChecklist />, { authStatus: 'authenticated' });
    await screen.findByText('2 of 4 done');

    const actionButton = screen.getByRole('button', { name: 'Configure' });
    fireEvent.click(actionButton);

    expect(screen.getByText('2 of 4 done')).toBeInTheDocument();
  });
});
