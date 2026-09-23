import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GoogleButton from '../components/auth/GoogleButton';

vi.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('GoogleButton', () => {
  it('renders the Continue with Google label', () => {
    render(<GoogleButton />);
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });
});
