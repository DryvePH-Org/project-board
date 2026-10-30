-- ============================================================
--  Phase 1 — Auth and team access
--
--  Run after supabase/schema.sql, in Supabase → SQL Editor.
--  Safe to run more than once.
--
--  Before the allowlist trigger is enabled, add at least one
--  teammate email, or nobody will be able to create an account:
--
--    insert into public.allowed_emails (email, note)
--    values ('you@team.com', 'owner')
--    on conflict (email) do nothing;
--
--  Existing accounts are not re-checked; the allowlist only
--  guards new sign-ups. Remove access by deleting the account in
--  Authentication → Users.
-- ============================================================

-- ------------------------------------------------------------
-- Profiles (one row per auth user)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  name       text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "team can read profiles" on public.profiles;
drop policy if exists "edit own profile" on public.profiles;

create policy "team can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "edit own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, update on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- Fill a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'teammate'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Invite list
-- ------------------------------------------------------------
create table if not exists public.allowed_emails (
  email      text primary key,
  note       text not null default '',
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
revoke all on public.allowed_emails from anon, authenticated;
-- No policies on purpose: only the dashboard / service role manages this list.

create or replace function public.enforce_team_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.allowed_emails a
    where lower(a.email) = lower(new.email)
  ) then
    raise exception 'This email is not on the team list.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_team_allowlist on auth.users;
create trigger enforce_team_allowlist
  before insert on auth.users
  for each row execute function public.enforce_team_allowlist();

-- ------------------------------------------------------------
-- Lock the existing tables to signed-in teammates only.
-- (Replaces the original no-login anon policies.)
-- ------------------------------------------------------------
drop policy if exists "anon read projects"  on public.projects;
drop policy if exists "anon write projects" on public.projects;
drop policy if exists "anon read updates"   on public.updates;
drop policy if exists "anon write updates"  on public.updates;
drop policy if exists "anon read blockers"  on public.blockers;
drop policy if exists "anon write blockers" on public.blockers;

drop policy if exists "team reads projects"  on public.projects;
drop policy if exists "team writes projects" on public.projects;
drop policy if exists "team reads updates"   on public.updates;
drop policy if exists "team writes updates"  on public.updates;
drop policy if exists "team reads blockers"  on public.blockers;
drop policy if exists "team writes blockers" on public.blockers;

create policy "team reads projects"  on public.projects for select to authenticated using (true);
create policy "team writes projects" on public.projects for all    to authenticated using (true) with check (true);
create policy "team reads updates"   on public.updates  for select to authenticated using (true);
create policy "team writes updates"  on public.updates  for all    to authenticated using (true) with check (true);
create policy "team reads blockers"  on public.blockers for select to authenticated using (true);
create policy "team writes blockers" on public.blockers for all    to authenticated using (true) with check (true);

revoke all on public.projects from anon;
revoke all on public.updates  from anon;
revoke all on public.blockers from anon;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.updates  to authenticated;
grant select, insert, update, delete on public.blockers to authenticated;
