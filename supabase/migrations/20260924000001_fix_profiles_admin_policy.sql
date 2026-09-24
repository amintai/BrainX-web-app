-- The original admin policy checked the top-level JWT `role` claim, which Supabase
-- always sets to 'authenticated', so it never matched. The app stores roles in
-- app_metadata (server-controlled, not editable by the client) — check that instead.
drop policy if exists "Admins can read all profiles" on public.profiles;

create policy "Admins can read all profiles"
  on public.profiles for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
