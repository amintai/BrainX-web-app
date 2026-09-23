import { describe, it, expect } from 'vitest';
import { deriveIdentity } from './identity.js';

describe('deriveIdentity', () => {
  it('splits the email local part into a full/first name and initials', () => {
    expect(deriveIdentity({ email: 'deepti.jakhotra@tntra.io' })).toEqual({
      fullName: 'Deepti Jakhotra',
      firstName: 'Deepti',
      initials: 'DJ',
      roleLabel: 'Member',
    });
  });

  it('reads roleLabel from app_metadata.role', () => {
    const identity = deriveIdentity({
      email: 'deepti.jakhotra@tntra.io',
      app_metadata: { role: 'admin' },
    });
    expect(identity.roleLabel).toBe('Admin');
  });

  it('returns the "there"/"?" fallback for a missing user', () => {
    expect(deriveIdentity(null)).toEqual({
      fullName: 'there',
      firstName: 'there',
      initials: '?',
      roleLabel: 'Member',
    });
  });

  it('never reads role from the user-editable user_metadata field', () => {
    const identity = deriveIdentity({
      email: 'deepti.jakhotra@tntra.io',
      user_metadata: { role: 'admin' },
    });
    expect(identity.roleLabel).toBe('Member');
  });
});
