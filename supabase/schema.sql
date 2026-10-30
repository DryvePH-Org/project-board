-- ============================================================
--  Pulseboard schema
--  Run this in Supabase → SQL Editor → New query → Run
--  Safe to run more than once.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (char_length(trim(name)) > 0),
  description text        not null default '',
  owner       text        not null default '',
  stage       text        not null default 'backlog'
              check (stage in ('backlog','planning','in_progress','review','launch','done')),
  priority    text        not null default 'medium'
              check (priority in ('low','medium','high')),
  status      text        not null default 'on_track'
              check (status in ('on_track','at_risk','blocked','done')),
  start_date  date,
  due_date    date,
  progress    integer     not null default 0 check (progress between 0 and 100),
  color       text        not null default '#4f46e5',
  archived    boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.updates (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  update_date   date not null default current_date,
  status        text not null default 'on_track'
                check (status in ('on_track','at_risk','blocked','done')),
  progress      integer not null default 0 check (progress between 0 and 100),
  hours         numeric(6,2) check (hours is null or hours >= 0),
  summary       text not null check (char_length(trim(summary)) > 0),
  next_step     text not null default '',
  blockers_note text not null default '',
  author        text not null default '',
  created_at    timestamptz not null default clock_timestamp()
);

create table if not exists public.blockers (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(trim(title)) > 0),
  detail      text not null default '',
  severity    text not null default 'medium'
              check (severity in ('low','medium','high','critical')),
  status      text not null default 'open' check (status in ('open','resolved')),
  owner       text not null default '',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists projects_stage_idx  on public.projects (stage) where archived = false;
create index if not exists updates_project_idx on public.updates (project_id, update_date desc, created_at desc);
create index if not exists blockers_project_idx on public.blockers (project_id, status);
create index if not exists blockers_open_idx   on public.blockers (status) where status = 'open';

-- ------------------------------------------------------------
-- Keep projects.updated_at honest
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
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

-- ------------------------------------------------------------
-- Keep the project's progress + status in sync with its
-- newest daily update. This is what makes cards, the board and
-- the timeline agree with the update history.
-- ------------------------------------------------------------
create or replace function public.sync_project_from_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid        uuid;
  v_progress integer;
  v_status   text;
  v_found    boolean;
begin
  pid := coalesce(new.project_id, old.project_id);

  select u.progress, u.status
    into v_progress, v_status
  from public.updates u
  where u.project_id = pid
  order by u.update_date desc, u.created_at desc
  limit 1;

  v_found := found;

  if not v_found then
    update public.projects
       set progress = 0
     where id = pid;
    return null;
  end if;

  update public.projects p
     set progress = v_progress,
         status   = v_status,
         stage    = case
                      when v_status = 'done' then 'done'
                      when p.stage = 'done' then 'in_progress'
                      else p.stage
                    end
   where p.id = pid;

  return null;
end;
$$;

drop trigger if exists updates_sync on public.updates;
create trigger updates_sync
after insert or update or delete on public.updates
for each row execute function public.sync_project_from_update();

-- ------------------------------------------------------------
-- Row level security
--
-- The app has no login, so the anonymous key is allowed to read
-- and write. Anyone with the deployed URL can therefore edit.
-- Keep the link inside the team.
--
-- HARDENING LATER: enable Supabase Auth, then replace the two
-- policies below with, e.g.:
--   create policy "team read" on public.projects
--     for select to authenticated using (true);
--   create policy "team write" on public.projects
--     for all to authenticated using (true) with check (true);
-- and remove the anon policies.
-- ------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.updates  enable row level security;
alter table public.blockers enable row level security;

drop policy if exists "anon read projects"  on public.projects;
drop policy if exists "anon write projects" on public.projects;
drop policy if exists "anon read updates"   on public.updates;
drop policy if exists "anon write updates"  on public.updates;
drop policy if exists "anon read blockers"  on public.blockers;
drop policy if exists "anon write blockers" on public.blockers;

create policy "anon read projects"  on public.projects for select using (true);
create policy "anon write projects" on public.projects for all    using (true) with check (true);
create policy "anon read updates"   on public.updates  for select using (true);
create policy "anon write updates"  on public.updates  for all    using (true) with check (true);
create policy "anon read blockers"  on public.blockers for select using (true);
create policy "anon write blockers" on public.blockers for all    using (true) with check (true);

grant select, insert, update, delete on public.projects to anon, authenticated;
grant select, insert, update, delete on public.updates  to anon, authenticated;
grant select, insert, update, delete on public.blockers to anon, authenticated;
