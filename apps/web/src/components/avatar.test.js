import { describe, it, expect } from 'vitest';
import { getInitials, toneFor } from './avatar.js';

describe('getInitials', () => {
  it('returns the first letters of the first two words, uppercased', () => {
    expect(getInitials('Marcus Vance')).toBe('MV');
  });

  it('falls back to the first two characters for a single word', () => {
    expect(getInitials('Cher')).toBe('CH');
  });
});

describe('toneFor', () => {
  it('is deterministic for the same name', () => {
    const first = toneFor('Marcus Vance');
    const second = toneFor('Marcus Vance');
    expect(first).toBe(second);
  });

  it('always returns one of the 4 literal tone-pair strings', () => {
    const allowed = [
      'bg-secondary-fixed text-on-secondary-fixed',
      'bg-error-container text-on-error-container',
      'bg-surface-container-highest text-on-surface',
      'bg-primary-container text-primary-fixed-dim',
    ];
    expect(allowed).toContain(toneFor('Some Name'));
    expect(allowed).toContain(toneFor('Another Person'));
  });
});
