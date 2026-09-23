-- Create profiles table that mirrors auth.users
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member' check (role in ('admin', 'manager', 'member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (auth.jwt() ->> 'role' = 'admin');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
