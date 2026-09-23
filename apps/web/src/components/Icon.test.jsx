import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon.jsx';

describe('Icon', () => {
  it('renders decorative by default with the given size', () => {
    const { container } = render(<Icon name="lock" />);
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('aria-hidden', 'true');
    expect(span.style.fontSize).toBe('20px');
  });

  it('renders as a labelled image when `label` is given', () => {
    const { container } = render(<Icon name="lock" label="Locked" />);
    const span = container.querySelector('span');
    expect(span).toHaveAttribute('role', 'img');
    expect(span).toHaveAttribute('aria-label', 'Locked');
    expect(span).not.toHaveAttribute('aria-hidden');
  });

  it('sets the FILL variation axis when `filled` is true', () => {
    const { container } = render(<Icon name="lock" filled />);
    const span = container.querySelector('span');
    expect(span.style.fontVariationSettings).toContain("'FILL' 1");
  });
});
