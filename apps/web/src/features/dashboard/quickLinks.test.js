import { describe, it, expect } from 'vitest';
import { QUICK_LINKS } from './quickLinks.js';
import { ROUTES } from '../../app/routes.js';

describe('QUICK_LINKS', () => {
  it('has exactly 4 entries, only "users" navigable', () => {
    expect(QUICK_LINKS).toHaveLength(4);
    const navigable = QUICK_LINKS.filter((link) => link.to);
    expect(navigable).toHaveLength(1);
    expect(navigable[0].key).toBe('users');
    expect(navigable[0].to).toBe(ROUTES.users);
  });
});
