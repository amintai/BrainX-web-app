# Avatar File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual avatar URL text input with a clickable avatar circle that uploads images to Supabase Storage and persists the public URL to the user's profile.

**Architecture:** A new `avatars` Storage bucket is created via migration with public read / user-scoped write RLS. The backend exposes `POST /api/v1/users/me/avatar` (multer multipart, memory storage) which validates, uploads to Supabase Storage, then updates `profiles.avatar_url`. The frontend `AvatarUpload` component replaces the text input on ProfilePage and uses `useApiMutation` to post to the endpoint.

**Tech Stack:** multer (multipart parsing), @supabase/supabase-js storage API, React, TanStack Query, lucide-react (Camera icon), Vitest + Supertest.

**Spec:** `docs/superpowers/specs/2026-09-23-avatar-upload-design.md`

## Global Constraints

- API response envelope: `{ success: true, data: T }` / `{ success: false, error: { code, message } }` — all endpoints
- All routes prefixed `/api/v1/`
- Auth middleware (`authenticate`) required on the upload endpoint
- Max file size: 2 MB (2 097 152 bytes)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Supabase service-role key only on the backend — never in frontend env vars
- No SQL interpolation — use Supabase JS client only
- `useApiMutation` (not raw `useMutation`) for frontend mutations — ensures error toasts fire automatically

## Review Focus

1. **File over 2 MB sent directly to the backend** — must return 413 `FILE_TOO_LARGE` before any upload attempt; test in Task 1.
2. **Non-image MIME type (e.g. `application/pdf`)** — must return 400 `INVALID_FILE_TYPE` with no upload; test in Task 1.
3. **Request with no file attached** — must return 400 `NO_FILE`; test in Task 1.
4. **Supabase Storage upload fails (network / bucket error)** — backend must return 500 `UPLOAD_FAILED` without updating `profiles.avatar_url`; test in Task 1.
5. **Client picks a valid file, upload succeeds, then user navigates away before invalidation fires** — `['profile', 'me']` cache must be invalidated on success so the new avatar is reflected everywhere without a full page reload; test in Task 2.

---

## Task 1: Storage bucket migration + backend avatar endpoint

**Files:**

- Create: `supabase/migrations/20260923000002_create_avatars_bucket.sql`
- Create: `apps/api/src/middleware/avatarUpload.middleware.ts`
- Create: `apps/api/src/services/avatar.service.ts`
- Create: `apps/api/src/controllers/avatar.controller.ts`
- Modify: `apps/api/src/routes/users.routes.ts`
- Test: `apps/api/src/__tests__/avatar.test.ts`

**Interfaces:**

- Produces:
  - `POST /api/v1/users/me/avatar` — multipart/form-data field `avatar`, returns `ApiSuccess<Profile>`
  - `AvatarService.uploadAvatar(userId: string, buffer: Buffer, mimetype: string): Promise<Profile>`
  - multer middleware exported as `avatarUploadMiddleware` — wraps `multer({ storage: memoryStorage(), limits: { fileSize: 2097152 } }).single('avatar')` with error-catching wrapper that converts `MulterError` to `AppError`

- [ ] **Step 1: Install multer**

```bash
pnpm --filter api add multer
pnpm --filter api add -D @types/multer
```

Expected: package.json updated with `multer` dependency.

- [ ] **Step 2: Write failing tests**

```typescript
// apps/api/src/__tests__/avatar.test.ts
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import path from 'path';
import { readFileSync } from 'fs';
import app from '../app';
import { supabaseAdmin } from '../integrations/supabase';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@brainx.io',
  app_metadata: { role: 'member' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockProfile = {
  id: mockUser.id,
  email: mockUser.email,
  full_name: 'Test User',
  avatar_url:
    'https://qyqkpvvxtxapfnhckndd.supabase.co/storage/v1/object/public/avatars/00000000-0000-0000-0000-000000000001/avatar.jpg',
  role: 'member',
  onboarding_completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Tiny valid 1×1 JPEG (37 bytes — real JPEG header)
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
    'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
    'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
    'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oA' +
    'DAMBAAIRAxEAPwCwABmX/9k=',
  'base64',
);

describe('POST /api/v1/users/me/avatar', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .attach('avatar', TINY_JPEG, { filename: 'avatar.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when no file is attached', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_FILE');
  });

  it('returns 400 for non-image MIME type', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', Buffer.from('%PDF-1.4'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('returns 413 when file exceeds 2 MB', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    const bigBuffer = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);
    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('returns 200 with updated profile on valid upload', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    // Mock storage upload
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: mockProfile.avatar_url },
      }),
    } as never);
    // Mock profile update
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    } as never);

    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', TINY_JPEG, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatar_url).toBe(mockProfile.avatar_url);
  });

  it('returns 500 when Supabase Storage upload fails', async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabaseAdmin.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: new Error('Storage error') }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
    } as never);

    const res = await request(app)
      .post('/api/v1/users/me/avatar')
      .set('Authorization', 'Bearer valid-token')
      .attach('avatar', TINY_JPEG, { filename: 'avatar.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('UPLOAD_FAILED');
  });
});
```

- [ ] **Step 3: Run tests — confirm RED**

```bash
pnpm --filter api test -- --reporter=verbose --testPathPattern="avatar"
```

Expected: all 6 tests fail with 404 (route not yet defined).

- [ ] **Step 4: Create storage bucket migration**

```sql
-- supabase/migrations/20260923000002_create_avatars_bucket.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Users can upload/update/delete only inside their own folder
create policy "Users upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read avatars (public bucket)
create policy "Public avatar read"
  on storage.objects for select
  using (bucket_id = 'avatars');
```

- [ ] **Step 5: Create multer middleware**

```typescript
// apps/api/src/middleware/avatarUpload.middleware.ts
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

export const avatarUploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum 2 MB allowed.', 413, 'FILE_TOO_LARGE'));
    }
    if (err) return next(err);
    next();
  });
};
```

- [ ] **Step 6: Create avatar service**

```typescript
// apps/api/src/services/avatar.service.ts
import { supabaseAdmin } from '../integrations/supabase';
import { AppError } from '../middleware/error.middleware';
import { updateProfile } from './users.service';
import type { Profile } from '@brainx/shared';

const BUCKET = 'avatars';
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const uploadAvatar = async (
  userId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<Profile> => {
  const ext = EXT_MAP[mimetype] ?? 'jpg';
  const storagePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

  if (uploadError) {
    throw new AppError('Failed to upload avatar to storage.', 500, 'UPLOAD_FAILED');
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);

  return updateProfile(userId, { avatar_url: publicUrl });
};
```

- [ ] **Step 7: Create avatar controller**

```typescript
// apps/api/src/controllers/avatar.controller.ts
import type { Request, Response, NextFunction } from 'express';
import * as AvatarService from '../services/avatar.service';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) throw new AppError('No file provided.', 400, 'NO_FILE');
    const profile = await AvatarService.uploadAvatar(
      req.user!.id,
      req.file.buffer,
      req.file.mimetype,
    );
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 8: Add route to users.routes.ts**

Add these imports at the top of `apps/api/src/routes/users.routes.ts`:

```typescript
import { avatarUploadMiddleware } from '../middleware/avatarUpload.middleware';
import * as AvatarController from '../controllers/avatar.controller';
```

Add this route after the existing `/me` routes (before the admin-only section):

```typescript
router.post('/me/avatar', avatarUploadMiddleware, AvatarController.uploadAvatar);
```

- [ ] **Step 9: Run tests — confirm GREEN**

```bash
pnpm --filter api test -- --reporter=verbose --testPathPattern="avatar"
```

Expected: all 6 tests pass.

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/20260923000002_create_avatars_bucket.sql \
  apps/api/src/middleware/avatarUpload.middleware.ts \
  apps/api/src/services/avatar.service.ts \
  apps/api/src/controllers/avatar.controller.ts \
  apps/api/src/routes/users.routes.ts \
  apps/api/src/__tests__/avatar.test.ts
git commit -m "feat(avatar): add POST /users/me/avatar endpoint with Supabase Storage"
```

---

## Task 2: Frontend AvatarUpload component + ProfilePage integration

**Files:**

- Modify: `apps/web/src/utils/endpoints.ts`
- Create: `apps/web/src/components/profile/AvatarUpload.tsx`
- Modify: `apps/web/src/pages/profile/ProfilePage.tsx`
- Test: `apps/web/src/__tests__/avatarUpload.test.tsx`

**Interfaces:**

- Consumes:
  - `endpoints.users.avatar` = `/api/v1/users/me/avatar` (produced by this task)
  - `useApiMutation<Profile, FormData>` from `hooks/useApiMutation`
  - `queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })`
- Produces:
  - `AvatarUpload` component: `interface AvatarUploadProps { currentUrl: string | null | undefined; initials: string; }`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/__tests__/avatarUpload.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import AvatarUpload from '../components/profile/AvatarUpload';

const { mockPost, mockShowToastError } = vi.hoisted(() => ({
  mockPost: vi.fn().mockResolvedValue({ data: { success: true, data: { avatar_url: 'https://example.com/new.jpg' } } }),
  mockShowToastError: vi.fn(),
}));

vi.mock('../utils/client', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: mockPost, put: vi.fn(), del: vi.fn() },
}));

vi.mock('../utils/common', () => ({
  showToastSuccess: vi.fn(),
  showToastError: mockShowToastError,
}));

function wrap(ui: React.ReactNode) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null as never, status: 'authenticated' as never } },
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe('AvatarUpload', () => {
  it('renders initials when no avatar URL provided', () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders an img when avatar URL is provided', () => {
    wrap(<AvatarUpload currentUrl="https://example.com/avatar.jpg" initials="JD" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('shows toast error and does not upload when file type is invalid', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([Buffer.alloc(100)], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mockShowToastError).toHaveBeenCalled());
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows toast error and does not upload when file exceeds 2 MB', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([Buffer.alloc(2 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [bigFile] } });
    await waitFor(() => expect(mockShowToastError).toHaveBeenCalled());
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('calls POST /users/me/avatar with FormData on valid file selection', async () => {
    wrap(<AvatarUpload currentUrl={null} initials="JD" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([Buffer.alloc(100)], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/avatar'),
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    ));
  });
});
```

- [ ] **Step 2: Run tests — confirm RED**

```bash
pnpm --filter web test -- --reporter=verbose --testPathPattern="avatarUpload"
```

Expected: all 4 tests fail (AvatarUpload component does not exist).

- [ ] **Step 3: Add `avatar` endpoint to endpoints.ts**

In `apps/web/src/utils/endpoints.ts`, inside the `users` object add:

```typescript
avatar: `${base}/users/me/avatar`,
deleteMe: `${base}/users/me`,
```

The full `users` block becomes:

```typescript
users: {
  list: `${base}/users`,
  byId: (id: string) => `${base}/users/${id}`,
  role: (id: string) => `${base}/users/${id}/role`,
  avatar: `${base}/users/me/avatar`,
  deleteMe: `${base}/users/me`,
},
```

(Note: `deleteMe` is added here for the Settings plan — no implementation needed in this task.)

- [ ] **Step 4: Create AvatarUpload component**

```typescript
// apps/web/src/components/profile/AvatarUpload.tsx
import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '../../hooks/useApiMutation';
import { showToastError } from '../../utils/common';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import type { ApiSuccess, Profile } from '@brainx/shared';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AvatarUploadProps {
  currentUrl: string | null | undefined;
  initials: string;
}

const AvatarUpload = ({ currentUrl, initials }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useApiMutation<Profile, FormData>(
    (formData) =>
      client
        .post<ApiSuccess<Profile>>(endpoints.users.avatar, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
    {
      successMessage: 'Avatar updated',
      errorMessage: 'Failed to upload avatar',
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
    },
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToastError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      showToastError('File is too large. Maximum 2 MB allowed.');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    mutation.mutate(formData);
    e.target.value = '';
  };

  return (
    <button
      type="button"
      onClick={() => !mutation.isPending && inputRef.current?.click()}
      className="group relative h-24 w-24 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label="Upload avatar"
    >
      {currentUrl ? (
        <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-600 text-2xl font-bold select-none">
          {initials}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
        {mutation.isPending ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Camera size={20} className="text-white" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
};

export default AvatarUpload;
```

- [ ] **Step 5: Update ProfilePage**

Replace the contents of `apps/web/src/pages/profile/ProfilePage.tsx` entirely:

```typescript
// apps/web/src/pages/profile/ProfilePage.tsx
import { useFormik } from 'formik';
import { z } from 'zod';
import type { ApiSuccess, Profile } from '@brainx/shared';
import { useAuth } from '../../hooks/useAuth';
import { useApiMutation } from '../../hooks/useApiMutation';
import client from '../../utils/client';
import { endpoints } from '../../utils/endpoints';
import AvatarUpload from '../../components/profile/AvatarUpload';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Max 100 characters'),
});

type ProfileFormValues = { full_name: string };

const getInitials = (name: string | null | undefined, email: string | undefined): string => {
  if (name?.trim()) return name.trim()[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
};

const ProfilePage = () => {
  const { user, refresh } = useAuth();

  const mutation = useApiMutation<Profile, ProfileFormValues>(
    (values) =>
      client
        .patch<ApiSuccess<Profile>>(endpoints.auth.me, { full_name: values.full_name })
        .then((r) => r.data),
    { successMessage: 'Profile updated', onSuccess: () => refresh() },
  );

  const formik = useFormik<ProfileFormValues>({
    enableReinitialize: true,
    initialValues: {
      full_name: (user?.user_metadata?.full_name as string) ?? '',
    },
    validate: (values) => {
      const result = profileSchema.safeParse(values);
      if (result.success) return {};
      return Object.fromEntries(result.error.errors.map((e) => [e.path[0], e.message]));
    },
    onSubmit: (values) => mutation.mutate(values),
  });

  const avatarUrl = user?.user_metadata?.avatar_url as string | null | undefined;
  const initials = getInitials(user?.user_metadata?.full_name as string, user?.email);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Your Profile</h1>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <AvatarUpload currentUrl={avatarUrl} initials={initials} />
          <div>
            <p className="text-sm font-medium text-gray-700">Profile photo</p>
            <p className="text-xs text-gray-400">JPEG, PNG or WebP · max 2 MB</p>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="full_name">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              {...formik.getFieldProps('full_name')}
            />
            {formik.touched.full_name && formik.errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{formik.errors.full_name}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
```

- [ ] **Step 6: Run tests — confirm GREEN**

```bash
pnpm --filter web test -- --reporter=verbose --testPathPattern="avatarUpload"
```

Expected: all 4 tests pass.

- [ ] **Step 7: Run full web suite**

```bash
pnpm --filter web test
```

Expected: all existing tests still pass (18+4 = 22 total).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/utils/endpoints.ts \
  apps/web/src/components/profile/AvatarUpload.tsx \
  apps/web/src/pages/profile/ProfilePage.tsx \
  apps/web/src/__tests__/avatarUpload.test.tsx
git commit -m "feat(avatar): add AvatarUpload component and update ProfilePage"
```
