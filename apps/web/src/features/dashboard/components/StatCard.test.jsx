import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard.jsx';
import { TrendPill } from './TrendPill.jsx';

describe('TrendPill', () => {
  it('renders an up trend for a non-negative change', () => {
    const { container } = render(<TrendPill changePct={12.4} />);
    expect(screen.getByText('+12.4%')).toBeInTheDocument();
    expect(container.querySelector('.bg-emerald-50')).toBeInTheDocument();
  });

  it('renders a down trend for a negative change', () => {
    const { container } = render(<TrendPill changePct={-3.1} />);
    expect(screen.getByText('-3.1%')).toBeInTheDocument();
    expect(container.querySelector('.bg-error-container')).toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('renders label, value, icon, and footer content together', () => {
    render(
      <StatCard label="Total Active Users" value="2,845" icon="group" iconTone="secondary">
        footer
      </StatCard>,
    );
    expect(screen.getByText('Total Active Users')).toBeInTheDocument();
    expect(screen.getByText('2,845')).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });
});
