import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store/store';

// Minimal smoke test — verifies the Redux provider mounts without error
describe('BrainX web app', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <div data-testid="app-root">BrainX</div>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});
