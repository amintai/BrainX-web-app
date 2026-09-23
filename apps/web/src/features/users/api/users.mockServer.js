/**
 * Mock-only filter/paginate logic (ADR-6). Deleted when a real `/users`
 * endpoint replaces `users.api.js`'s fetcher.
 */
export function filterUsers(users, search) {
  const query = search.trim().toLowerCase();
  if (!query) return users;
  return users.filter(
    (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
  );
}

export function paginate(filtered, page, pageSize) {
  const total = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return { items, total };
}
