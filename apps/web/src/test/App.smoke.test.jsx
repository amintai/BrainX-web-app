import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Providers } from '../app/Providers.jsx';

describe('App smoke test', () => {
  it('renders the full Providers tree without throwing', () => {
    expect(() => render(<Providers />)).not.toThrow();
  });
});
