-- ============================================================
--  Pulseboard schema
--
--  Run this in Supabase → SQL Editor → New query → Run.
--  Safe to run more than once.
--
--  Before you sign in, add at least one teammate email, or
--  nobody will be able to create an account:
--
--    insert into public.allowed_emails (email, note)
--    values ('you@team.com', 'owner')
--    on conflict (email) do nothing;
--
--  Existing accounts are not re-checked; the allowlist only
--  guards new sign-ups. Remove access by deleting the account in
--  Authentication → Users.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Auth: profiles + team allowlist
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
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

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

revoke all on function public.handle_new_user() from public, anon, authenticated;

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

revoke all on function public.enforce_team_allowlist() from public, anon, authenticated;

-- ------------------------------------------------------------
-- Projects
-- ------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (char_length(trim(name)) > 0),
  description text        not null default '',
  owner       text        not null default '',
  status      text        not null default 'on_track'
              check (status in ('on_track','at_risk','blocked','done')),
  color       text        not null default '#4f46e5',
  archived    boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status) where archived = false;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch
before update on public.projects
for each row execute function public.touch_updated_at();

revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- ------------------------------------------------------------
-- Freeform board: nodes (blocks) + edges (links between them)
-- ------------------------------------------------------------
do $$ begin
  create type public.node_state as enum ('idea', 'planned', 'in_progress', 'blocked', 'done');
exception when duplicate_object then null;
end $$;

create table if not exists public.nodes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(trim(title)) > 0),
  note        text not null default '',
  state       public.node_state not null default 'idea',
  position_x  double precision not null default 0,
  position_y  double precision not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.edges (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  source_id    uuid not null references public.nodes(id) on delete cascade,
  target_id    uuid not null references public.nodes(id) on delete cascade,
  blocked      boolean not null default false,
  blocker_note text    not null default '',
  created_at   timestamptz not null default now(),
  check (source_id <> target_id),
  unique (source_id, target_id)
);

-- In case schema.sql ran before blockers were added to edges.
alter table public.edges add column if not exists blocked      boolean not null default false;
alter table public.edges add column if not exists blocker_note text    not null default '';

-- ------------------------------------------------------------
-- Comments: suggestions left on a block
-- ------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  node_id    uuid not null references public.nodes(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  body       text not null check (char_length(trim(body)) > 0),
  author     text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists nodes_project_idx    on public.nodes (project_id);
create index if not exists edges_project_idx    on public.edges (project_id);
create index if not exists edges_source_idx     on public.edges (source_id);
create index if not exists edges_target_idx     on public.edges (target_id);
create index if not exists comments_node_idx    on public.comments (node_id);
create index if not exists comments_project_idx on public.comments (project_id);

-- ------------------------------------------------------------
-- Row level security — any signed-in teammate can read/write
-- everything. Good enough for a small internal team; tighten
-- later with per-owner policies if you need them.
-- ------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.nodes    enable row level security;
alter table public.edges    enable row level security;
alter table public.comments enable row level security;

drop policy if exists "team access projects" on public.projects;
drop policy if exists "team access nodes" on public.nodes;
drop policy if exists "team access edges" on public.edges;
drop policy if exists "team access comments" on public.comments;

create policy "team access projects" on public.projects for all to authenticated using (true) with check (true);
create policy "team access nodes"    on public.nodes    for all to authenticated using (true) with check (true);
create policy "team access edges"    on public.edges    for all to authenticated using (true) with check (true);
create policy "team access comments" on public.comments for all to authenticated using (true) with check (true);

revoke all on public.projects from anon;
revoke all on public.nodes    from anon;
revoke all on public.edges    from anon;
revoke all on public.comments from anon;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.nodes    to authenticated;
grant select, insert, update, delete on public.edges    to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
