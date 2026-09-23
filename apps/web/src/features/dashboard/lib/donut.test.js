import { describe, it, expect } from 'vitest';
import { computeDonutSegments } from './donut.js';

describe('computeDonutSegments', () => {
  it('produces fractions matching 10/30/60% for the Stitch counts', () => {
    const segments = computeDonutSegments([285, 853, 1707]);
    const percents = segments.map((s) => Math.round(s.fraction * 100));
    expect(percents).toEqual([10, 30, 60]);
  });

  it('sums segment lengths to within 0.01 of the circumference', () => {
    const segments = computeDonutSegments([285, 853, 1707]);
    const circumference = 2 * Math.PI * 38;
    const totalLength = segments.reduce((sum, s) => sum + parseFloat(s.dashArray.split(' ')[0]), 0);
    expect(Math.abs(totalLength - circumference)).toBeLessThan(0.01);
  });

  it('returns [] when the total is 0', () => {
    expect(computeDonutSegments([0, 0, 0])).toEqual([]);
  });
});
