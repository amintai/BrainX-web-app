import { describe, it, expect } from 'vitest';
import { users } from './users.fixtures.js';
import { filterUsers, paginate } from './users.mockServer.js';

describe('filterUsers', () => {
  it('matches case-insensitively on name', () => {
    const result = filterUsers(users, 'MARCUS');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((u) => u.name.toLowerCase().includes('marcus'))).toBe(true);
  });

  it('returns all users for an empty query', () => {
    expect(filterUsers(users, '')).toHaveLength(24);
  });

  it('matches on email substring', () => {
    const result = filterUsers(users, 'vance@');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Marcus Vance');
  });
});

describe('paginate', () => {
  it('returns the partial last page', () => {
    const { items, total } = paginate(users, 3, 10);
    expect(items).toHaveLength(4);
    expect(total).toBe(24);
  });

  it('returns exactly pageSize items on a full page', () => {
    const { items } = paginate(users, 1, 10);
    expect(items).toHaveLength(10);
  });
});
