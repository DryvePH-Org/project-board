-- ============================================================
--  Phase 4 — Nodes and checklist view
--
--  Run after supabase/schema.sql and supabase/phase1_auth.sql,
--  in Supabase → SQL Editor. Safe to run more than once.
--
--  Adds the data behind the checklist and (Phase 5) flowchart:
--  nodes are steps/milestones/questions, edges are arrows
--  between them. Also lets a daily update attach to a node.
-- ============================================================

do $$ begin
  create type public.node_state as enum ('idea', 'planned', 'in_progress', 'blocked', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.node_kind as enum ('step', 'milestone', 'question');
exception when duplicate_object then null;
end $$;

create table if not exists public.nodes (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title      text not null check (char_length(trim(title)) > 0),
  note       text not null default '',
  kind       public.node_kind  not null default 'step',
  state      public.node_state not null default 'idea',
  due_date   date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.edges (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id  uuid not null references public.nodes(id) on delete cascade,
  target_id  uuid not null references public.nodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (source_id <> target_id),
  unique (source_id, target_id)
);

create index if not exists nodes_project_idx on public.nodes (project_id);
create index if not exists edges_project_idx on public.edges (project_id);
create index if not exists edges_source_idx  on public.edges (source_id);
create index if not exists edges_target_idx  on public.edges (target_id);

-- A daily update can optionally attach to, and move, a node (Phase 6).
alter table public.updates add column if not exists node_id uuid;

do $$ begin
  alter table public.updates
    add constraint updates_node_fk foreign key (node_id)
    references public.nodes(id) on delete set null;
exception when duplicate_object then null;
end $$;

create index if not exists updates_node_idx on public.updates (node_id) where node_id is not null;

-- ------------------------------------------------------------
-- Row level security — same "any signed-in teammate" model as
-- the rest of the app.
-- ------------------------------------------------------------
alter table public.nodes enable row level security;
alter table public.edges enable row level security;

drop policy if exists "team access nodes" on public.nodes;
drop policy if exists "team access edges" on public.edges;

create policy "team access nodes" on public.nodes for all to authenticated using (true) with check (true);
create policy "team access edges" on public.edges for all to authenticated using (true) with check (true);

revoke all on public.nodes from anon;
revoke all on public.edges from anon;

grant select, insert, update, delete on public.nodes to authenticated;
grant select, insert, update, delete on public.edges to authenticated;
