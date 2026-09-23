import { describe, it, expect } from 'vitest';
import { PRIMARY_NAV, FOOTER_NAV } from './navigation.js';

describe('navigation config', () => {
  it('lists the 4 primary nav items in order', () => {
    expect(PRIMARY_NAV.map((item) => item.key)).toEqual([
      'dashboard',
      'users',
      'analytics',
      'settings',
    ]);
  });

  it('marks the Dashboard item with end: true', () => {
    expect(PRIMARY_NAV.find((item) => item.key === 'dashboard').end).toBe(true);
  });

  it('lists support and logout in the footer group', () => {
    expect(FOOTER_NAV.map((item) => item.key)).toEqual(['support', 'logout']);
  });
});
