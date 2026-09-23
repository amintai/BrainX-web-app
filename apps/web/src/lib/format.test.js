import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatRelativeTime } from './format.js';

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(2845)).toBe('2,845');
  });
});

describe('formatPercent', () => {
  it('rounds a fraction to a whole-number percent', () => {
    expect(formatPercent(0.1)).toBe('10%');
    expect(formatPercent(0.6)).toBe('60%');
  });
});

describe('formatRelativeTime', () => {
  it('formats a date 8 minutes before `now`', () => {
    const now = new Date('2026-09-23T12:00:00Z').getTime();
    const eightMinutesAgo = new Date(now - 8 * 60 * 1000);
    expect(formatRelativeTime(eightMinutesAgo, now)).toContain('8 minutes ago');
  });

  it('does not throw without an explicit `now`', () => {
    expect(() => formatRelativeTime(new Date())).not.toThrow();
  });
});
