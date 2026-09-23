import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card.jsx';

describe('Card', () => {
  it('renders a section with the base classes by default', () => {
    const { container } = render(<Card>content</Card>);
    const el = container.firstChild;
    expect(el.tagName).toBe('SECTION');
    expect(el.className).toContain('rounded-xl');
    expect(el.className).toContain('bg-surface-container-lowest');
    expect(el.className).toContain('p-space-lg');
    expect(el.className).toContain('shadow-xs');
  });

  it('renders the element given by `as`', () => {
    const { container } = render(<Card as="article">content</Card>);
    expect(container.firstChild.tagName).toBe('ARTICLE');
  });
});
