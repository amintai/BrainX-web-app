import { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from './AuthProvider.jsx';
import { useIdentity } from './useIdentity.js';

let results = [];

function Probe() {
  const identity = useIdentity();
  results.push(identity);
  return <div>{identity.fullName}</div>;
}

function Harness() {
  const [, forceRender] = useState(0);
  const [user] = useState(() => ({ email: 'deepti.jakhotra@tntra.io' }));
  return (
    <AuthContext.Provider value={{ session: null, user, status: 'authenticated' }}>
      <button onClick={() => forceRender((n) => n + 1)}>rerender</button>
      <Probe />
    </AuthContext.Provider>
  );
}

describe('useIdentity', () => {
  beforeEach(() => {
    results = [];
  });

  it('derives fullName from the authenticated user', () => {
    render(<Harness />);
    expect(screen.getByText('Deepti Jakhotra')).toBeInTheDocument();
  });

  it('memoises the derived identity across re-renders with the same user reference', () => {
    render(<Harness />);
    const first = results[0];
    fireEvent.click(screen.getByText('rerender'));
    const second = results[results.length - 1];
    expect(second).toBe(first);
  });
});
