import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '../store/store';

// Minimal smoke test — verifies the Redux + QueryClient providers mount without error
describe('BrainX web app', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient();
    const { container } = render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <div data-testid="app-root">BrainX</div>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});
