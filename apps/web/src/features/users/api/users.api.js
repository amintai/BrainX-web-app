import { users } from './users.fixtures.js';
import { filterUsers, paginate } from './users.mockServer.js';
import { userListResponseSchema } from './users.schemas.js';

/** Mock fetcher (ADR-6 swap point). Filters/paginates in-browser, no network I/O. */
export async function fetchUsers({ search, page, pageSize }) {
  const filtered = filterUsers(users, search);
  const { items, total } = paginate(filtered, page, pageSize);
  return userListResponseSchema.parse({ items: structuredClone(items), total, page, pageSize });
}
