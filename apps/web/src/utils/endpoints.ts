const base = '/api/v1';

export const endpoints = {
  auth: {
    me: `${base}/users/me`,
    logout: `${base}/auth/logout`,
  },
  users: {
    list: `${base}/users`,
    byId: (id: string) => `${base}/users/${id}`,
    role: (id: string) => `${base}/users/${id}/role`,
  },
  stats: {
    summary: `${base}/stats`,
  },
  onboarding: {
    complete: `${base}/users/me/onboarding/complete`,
  },
};
