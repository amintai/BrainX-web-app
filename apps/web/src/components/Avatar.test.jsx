import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar.jsx';

const TONE_CLASSES = [
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-error-container text-on-error-container',
  'bg-surface-container-highest text-on-surface',
  'bg-primary-container text-primary-fixed-dim',
];

describe('Avatar', () => {
  it('falls back to initials when the image errors', () => {
    const { container } = render(<Avatar name="Marcus Vance" src="/broken.png" />);
    const img = container.querySelector('img');
    fireEvent.error(img);

    const fallback = container.querySelector('div');
    expect(fallback).toHaveTextContent('MV');
    expect(TONE_CLASSES.some((tone) => fallback.className.includes(tone))).toBe(true);
  });

  it('renders initials directly when no src is given', () => {
    const { getByText } = render(<Avatar name="Chloe Chen" src={null} />);
    expect(getByText('CC')).toBeInTheDocument();
  });
});
