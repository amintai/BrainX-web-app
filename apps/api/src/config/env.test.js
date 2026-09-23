import { describe, it, expect } from 'vitest';
import { loadConfig } from './env.js';

const baseEnv = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

describe('config/env', () => {
  it('throws naming missing required variables without leaking values', () => {
    let thrown;
    try {
      loadConfig({ SUPABASE_SERVICE_ROLE_KEY: 'secret-value-should-not-leak' });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toContain('SUPABASE_URL');
    expect(thrown.message).not.toContain('secret-value-should-not-leak');
  });

  it('freezes the config object and applies defaults', () => {
    const config = loadConfig(baseEnv);
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.rateLimit.max).toBe(100);
    expect(config.rateLimit.windowMs).toBe(900000);
    expect(config.port).toBe(3000);
  });
});
