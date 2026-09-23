import { describe, it, expect } from 'vitest';
import { users } from './users.fixtures.js';
import { userSchema } from './users.schemas.js';

describe('users fixtures', () => {
  it('has exactly 24 users, each satisfying userSchema', () => {
    expect(users).toHaveLength(24);
    for (const user of users) {
      expect(() => userSchema.parse(user)).not.toThrow();
    }
  });

  it('covers every role and every status at least once', () => {
    const roles = new Set(users.map((u) => u.role));
    const statuses = new Set(users.map((u) => u.status));
    expect([...roles].sort()).toEqual(['administrator', 'guest', 'manager', 'member']);
    expect([...statuses].sort()).toEqual(['active', 'inactive', 'pending']);
  });
});
