import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryState } from './QueryState.jsx';

describe('QueryState', () => {
  it('renders the skeleton while pending', () => {
    render(
      <QueryState
        query={{ isPending: true, isError: false, data: undefined }}
        skeleton={<div>loading…</div>}
        errorMessage="failed"
      >
        {() => <div>data</div>}
      </QueryState>,
    );
    expect(screen.getByText('loading…')).toBeInTheDocument();
  });

  it('renders the error message on error', () => {
    render(
      <QueryState
        query={{ isPending: false, isError: true, data: undefined }}
        skeleton={<div>loading…</div>}
        errorMessage="Could not load."
      >
        {() => <div>data</div>}
      </QueryState>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load.');
  });

  it('renders children(data) on success', () => {
    const data = { value: 42 };
    render(
      <QueryState
        query={{ isPending: false, isError: false, data }}
        skeleton={<div>loading…</div>}
        errorMessage="failed"
      >
        {(d) => <div>{d.value}</div>}
      </QueryState>,
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
