# Avatar File Upload — Design Spec

**Status:** approved
**Date:** 2026-09-23
**Feature area:** Profile

---

## Goal

Replace the manual `avatar_url` text field on the Profile page with a clickable avatar circle that lets users upload an image directly. Files are stored in Supabase Storage; the public URL is saved to `profiles.avatar_url`.

## Acceptance Criteria

### Storage

**FR-AVT-001** — A `avatars` Supabase Storage bucket exists, is public (reads require no auth), has a 2 MB file-size limit, and only accepts MIME types `image/jpeg`, `image/png`, `image/webp`.

**FR-AVT-002** — RLS policies on `storage.objects`:

- INSERT: `bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]`
- UPDATE: same predicate
- DELETE: same predicate
- SELECT: `bucket_id = 'avatars'` (public read)

### Backend

**FR-AVT-003** — `POST /api/v1/users/me/avatar` exists, requires auth, and accepts `multipart/form-data` with a single file field named `avatar`.

**FR-AVT-004** — Files larger than 2 MB are rejected with HTTP 413 and `{ success: false, error: { code: "FILE_TOO_LARGE" } }`.

**FR-AVT-005** — Files with a MIME type other than `image/jpeg`, `image/png`, or `image/webp` are rejected with HTTP 400 and `{ success: false, error: { code: "INVALID_FILE_TYPE" } }`.

**FR-AVT-006** — A request with no file is rejected with HTTP 400 and `{ success: false, error: { code: "NO_FILE" } }`.

**FR-AVT-007** — An unauthenticated request returns HTTP 401.

**FR-AVT-008** — On success the file is uploaded to `avatars/{userId}/avatar.{ext}` with `upsert: true` (overwrites any previous avatar). The endpoint returns HTTP 200 with:

```json
{ "success": true, "data": { ...Profile } }
```

where `profile.avatar_url` is the Supabase Storage public URL.

**FR-AVT-009** — If the Supabase Storage upload fails, the endpoint returns HTTP 500 with `{ success: false, error: { code: "UPLOAD_FAILED" } }` and does not update `profiles.avatar_url`.

**FR-AVT-010** — `endpoints.users.avatar` = `/api/v1/users/me/avatar` is registered in `apps/web/src/utils/endpoints.ts`.

### Frontend

**FR-AVT-011** — The `avatar_url` text input is removed from ProfilePage. The Formik form manages `full_name` only.

**FR-AVT-012** — An `AvatarUpload` component appears above the form, rendering a 96×96 px circle. If `avatar_url` is set, it shows the image. Otherwise it shows the user's initials (first letter of `full_name`, or first letter of email, falling back to `?`) on a brand-100 background.

**FR-AVT-013** — On hover the circle shows a semi-transparent overlay with a camera icon.

**FR-AVT-014** — Clicking the circle opens a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">`.

**FR-AVT-015** — Before uploading, client-side validation rejects files over 2 MB or with disallowed MIME types with a `showToastError` call. No upload is attempted.

**FR-AVT-016** — During upload the overlay shows a spinner instead of the camera icon. The component is not re-clickable while uploading.

**FR-AVT-017** — On success, `queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })` is called so the avatar updates across the app. A success toast fires.

**FR-AVT-018** — On error, a toast error fires. The avatar reverts to its previous state.

## Out of Scope

- Cropping / resizing UI
- Multiple images or galleries
- Signed URLs (public bucket is sufficient for profile avatars)
