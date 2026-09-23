import { describe, it, expect } from 'vitest';
import { getPageItems } from './pageItems.js';

describe('getPageItems', () => {
  it('returns every page when totalPages <= 7', () => {
    expect(getPageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it('windows around the current page with ellipses for larger totals', () => {
    expect(getPageItems(5, 20)).toEqual([1, '…', 4, 5, 6, '…', 20]);
  });

  it('handles page 1 of a large total without a leading ellipsis', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, '…', 20]);
  });
});
