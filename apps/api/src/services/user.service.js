/**
 * Maps the authenticated Supabase user (set by requireAuth) to the public DTO
 * returned by GET /api/v1/me.
 */
export function getCurrentUser(authUser) {
  return { user: { id: authUser.id, email: authUser.email } };
}
