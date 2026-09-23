import { describe, it, expect } from 'vitest';
import { shouldRetry } from './queryClient.js';
import { AuthRequiredError } from '../lib/apiClient.js';

describe('shouldRetry', () => {
  it('does not retry an AuthRequiredError (status 401)', () => {
    expect(shouldRetry(0, new AuthRequiredError())).toBe(false);
  });

  it('does not retry any 4xx error', () => {
    expect(shouldRetry(0, { status: 404 })).toBe(false);
  });

  it('retries a non-4xx error up to 3 times', () => {
    expect(shouldRetry(0, { status: 500 })).toBe(true);
    expect(shouldRetry(2, { status: 500 })).toBe(true);
    expect(shouldRetry(3, { status: 500 })).toBe(false);
  });
});
