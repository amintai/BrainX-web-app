import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginBackdrop } from './LoginBackdrop.jsx';
import { LoginBrandHeader } from './LoginBrandHeader.jsx';

function LoginCard() {
  return (
    <div className="relative w-full max-w-md">
      <LoginBackdrop />
      <div className="relative bg-surface-container-lowest rounded-xl">
        <LoginBrandHeader />
      </div>
    </div>
  );
}

describe('LoginBackdrop + LoginBrandHeader', () => {
  it('renders the card decoration, circular logo frame, brand copy, badge, heading, and subtext', () => {
    const { container } = render(<LoginCard />);

    const decorations = container.querySelectorAll('.blur-3xl');
    expect(decorations).toHaveLength(2);

    const logoFrame = container.querySelector('.rounded-full.overflow-hidden');
    expect(logoFrame).toBeInTheDocument();

    expect(screen.getByText('Team BrainX')).toBeInTheDocument();
    expect(screen.getByText('TNTRA AI HACKATHON 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to access your hackathon workspace & projects'),
    ).toBeInTheDocument();
  });
});
