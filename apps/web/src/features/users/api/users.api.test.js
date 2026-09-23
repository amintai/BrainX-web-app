import { describe, it, expect } from 'vitest';
import { fetchUsers } from './users.api.js';
import { userListResponseSchema } from './users.schemas.js';

describe('fetchUsers', () => {
  it('resolves a value satisfying userListResponseSchema', async () => {
    const result = await fetchUsers({ search: '', page: 1, pageSize: 10 });
    expect(() => userListResponseSchema.parse(result)).not.toThrow();
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(24);
  });
});
