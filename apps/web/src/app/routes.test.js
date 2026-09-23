import { describe, it, expect } from 'vitest';
import { ROUTES } from './routes.js';

describe('ROUTES', () => {
  it('defines the three route paths', () => {
    expect(ROUTES.login).toBe('/login');
    expect(ROUTES.dashboard).toBe('/');
    expect(ROUTES.users).toBe('/users');
  });
});
