const FALLBACK_IDENTITY = {
  fullName: 'there',
  firstName: 'there',
  initials: '?',
  roleLabel: 'Member',
};

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Derives a display identity from the Supabase session user (ADR-9). The
 * role label reads only `app_metadata.role` (service-role-controlled),
 * never `user_metadata.role` (user-editable via `updateUser`).
 */
export function deriveIdentity(user) {
  if (!user?.email) {
    return FALLBACK_IDENTITY;
  }

  const local = user.email.split('@')[0];
  const words = local
    .split(/[._+-]/)
    .filter(Boolean)
    .map(titleCase);

  if (words.length === 0) {
    return FALLBACK_IDENTITY;
  }

  const fullName = words.join(' ');
  const firstName = words[0];
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  const roleLabel = user.app_metadata?.role ? titleCase(user.app_metadata.role) : 'Member';

  return { fullName, firstName, initials, roleLabel };
}
