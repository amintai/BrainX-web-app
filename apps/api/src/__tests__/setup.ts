import { vi } from 'vitest';

// Mock Supabase so tests never hit a real database
vi.mock('../integrations/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));
