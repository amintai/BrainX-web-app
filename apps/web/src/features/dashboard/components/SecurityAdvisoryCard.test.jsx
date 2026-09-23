import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityAdvisoryCard } from './SecurityAdvisoryCard.jsx';

describe('SecurityAdvisoryCard', () => {
  it('renders the static advisory in a bg-primary text-on-primary card', () => {
    const { container } = render(<SecurityAdvisoryCard />);
    const card = container.firstChild;
    expect(card.className).toContain('bg-primary');
    expect(card.className).toContain('text-on-primary');
    expect(screen.getByText('Enterprise Security Guarantee')).toBeInTheDocument();
  });
});
