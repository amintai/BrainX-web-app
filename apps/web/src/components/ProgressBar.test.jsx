import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressBar } from './ProgressBar.jsx';

describe('ProgressBar', () => {
  it('clamps values above 100', () => {
    const { getByRole } = render(<ProgressBar value={130} label="x" />);
    expect(getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('sets the fill width via inline style', () => {
    const { getByRole } = render(<ProgressBar value={40} label="x" />);
    const bar = getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar.firstChild.style.width).toBe('40%');
  });
});
