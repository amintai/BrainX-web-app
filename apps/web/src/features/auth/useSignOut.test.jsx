import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../lib/supabase.js', () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

import { supabase } from '../../lib/supabase.js';
import { queryClient } from '../../app/queryClient.js';
import { useSignOut } from './useSignOut.js';

function Probe() {
  const { signOut, isSigningOut } = useSignOut();
  return (
    <div>
      <button onClick={signOut}>go</button>
      <span>{isSigningOut ? 'signing-out' : 'idle'}</span>
    </div>
  );
}

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to a local-scope sign-out on error, then clears the query cache', async () => {
    supabase.auth.signOut
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ error: null });
    const clearSpy = vi.spyOn(queryClient, 'clear');

    render(<Probe />);
    fireEvent.click(screen.getByText('go'));

    expect(screen.getByText('signing-out')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());

    expect(supabase.auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' });
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
