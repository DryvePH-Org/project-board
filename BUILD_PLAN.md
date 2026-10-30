# Project Tracker: Build Plan

A simple team tool. Projects list → project detail → daily updates, a node flowchart, blockers, and comments. No percentages. Progress is the state of the nodes.

Build one phase at a time. Don't start the next until "Done when" is true.

---

## Stack (all free tier)

| Need | Tool | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | |
| Database, auth, realtime | Supabase | Free plan. Projects pause after about a week of inactivity, so open it regularly or the team will hit a paused DB. |
| UI | Tailwind CSS + shadcn/ui | |
| Flowchart | `@xyflow/react` (React Flow) | Free, MIT |
| Auto layout | `dagre` | Arranges nodes automatically |
| Data fetching | `@supabase/ssr` + server components | |
| Hosting | Vercel Hobby or Netlify free | Vercel Hobby is for non-commercial use. Check the terms, or use Netlify. |

---

## Core concepts

- **Project:** a name, owner, and status (On track / At risk / Blocked).
- **Node:** a step, milestone, or open question. State: `idea`, `planned`, `in_progress`, `blocked`, `done`.
- **Edge:** an arrow between two nodes. Nodes can float with no edges.
- **Update:** a freeform daily entry. Can attach to a node and change its state.
- **Comment:** reply on an update or a node.
- **Blocker:** any node in the `blocked` state. No separate table.

---

## Phase 0: Setup

**Goal:** empty app running, connected to Supabase.

- [ ] `npx create-next-app@latest` (TypeScript, Tailwind, App Router)
- [ ] Init shadcn/ui
- [ ] Create a Supabase project
- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create Supabase client helpers (browser, server, middleware)
- [ ] Push to GitHub

**Done when:** the app loads and a test query to Supabase returns without error.

---

## Phase 1: Auth and team access

**Goal:** only your team can sign in.

- [ ] Enable Supabase Auth (email magic link or Google)
- [ ] Login page, logout, and middleware that redirects signed-out users
- [ ] `profiles` table, auto-filled by a trigger on signup
- [ ] Restrict access: invite-only, or an allowed email list/domain check
- [ ] Turn on RLS for every table from now on

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "team can read profiles" on profiles
  for select to authenticated using (true);
create policy "edit own profile" on profiles
  for update to authenticated using (auth.uid() = id);
```

**Done when:** a teammate can sign in, a stranger can't, and your name shows in the header.

---

## Phase 2: Projects list

**Goal:** create and see projects.

```sql
create type project_status as enum ('on_track', 'at_risk', 'blocked');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references profiles(id),
  status project_status default 'on_track',
  start_date date,
  target_date date,
  created_at timestamptz default now()
);
alter table projects enable row level security;
create policy "team reads projects" on projects
  for select to authenticated using (true);
create policy "team writes projects" on projects
  for all to authenticated using (true) with check (true);
```

- [ ] `/projects` page with a card per project: name, owner, status badge, last update time
- [ ] "New project" dialog
- [ ] Edit and delete project

**Done when:** you can add three projects and see them in the list.

---

## Phase 3: Project detail and updates feed

**Goal:** post the daily update.

```sql
create table updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  node_id uuid,                -- linked in Phase 4
  author_id uuid references profiles(id),
  body text not null,
  old_state text,
  new_state text,
  created_at timestamptz default now()
);
alter table updates enable row level security;
create policy "team reads updates" on updates
  for select to authenticated using (true);
create policy "team writes updates" on updates
  for insert to authenticated with check (auth.uid() = author_id);
```

- [ ] `/projects/[id]` page: header (name, owner, status, dates)
- [ ] Update composer at the top (plain textarea first)
- [ ] Feed below, newest first, with author and time
- [ ] Project status can be changed from the header

**Done when:** you can post updates and they appear in the feed.

---

## Phase 4: Nodes and checklist view

**Goal:** the data behind the flow, shown as a simple list first.

```sql
create type node_state as enum ('idea', 'planned', 'in_progress', 'blocked', 'done');
create type node_kind as enum ('step', 'milestone', 'question');

create table nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  note text,
  kind node_kind default 'step',
  state node_state default 'idea',
  due_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  source_id uuid not null references nodes(id) on delete cascade,
  target_id uuid not null references nodes(id) on delete cascade,
  unique (source_id, target_id)
);

alter table updates
  add constraint updates_node_fk foreign key (node_id) references nodes(id) on delete set null;

alter table nodes enable row level security;
alter table edges enable row level security;
create policy "team all nodes" on nodes for all to authenticated using (true) with check (true);
create policy "team all edges" on edges for all to authenticated using (true) with check (true);
```

- [ ] Tabs on project detail: **Updates | Checklist | Flow**
- [ ] Checklist tab: add, rename, delete nodes, and change state
- [ ] State pill with a color per state
- [ ] Question nodes get a "?" marker

**Done when:** you can build a project's steps as a list and change their states.

---

## Phase 5: Flowchart view

**Goal:** see the same nodes as a map.

- [ ] Install `@xyflow/react` and `dagre`
- [ ] Custom node component: title, state color, dashed border for `idea`, "?" for questions
- [ ] Build layout from `nodes` and `edges`, run dagre (top to bottom or left to right)
- [ ] Draw edges by dragging from one node to another, saving to `edges`
- [ ] Click a node to open a side panel: edit title, note, state, due date
- [ ] Add node button, delete node and edge
- [ ] Prevent cycles and self-links

**Done when:** a project with 5 nodes and a loose "?" renders cleanly and edits sync with the checklist.

---

## Phase 6: Link updates to nodes

**Goal:** the daily update drives progress.

- [ ] In the composer, optional "Attach to node" dropdown
- [ ] Optional "Change state" dropdown when a node is picked
- [ ] On submit: insert the update, and update the node state in one call (use a Postgres function or RPC so both succeed or neither does)
- [ ] Feed entries show "Design review: In progress → Done"
- [ ] Node side panel shows its update history

**Done when:** posting an update with a state change moves the node on the flowchart.

---

## Phase 7: Comments

**Goal:** teammates can suggest and reply.

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid references updates(id) on delete cascade,
  node_id uuid references nodes(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz default now(),
  check (update_id is not null or node_id is not null)
);
alter table comments enable row level security;
create policy "team reads comments" on comments
  for select to authenticated using (true);
create policy "team writes comments" on comments
  for insert to authenticated with check (auth.uid() = author_id);
```

- [ ] Comment thread under each update
- [ ] Comment thread in the node side panel
- [ ] Comment count badge
- [ ] Authors can delete their own comments

**Done when:** a teammate can reply to your update and you see it.

---

## Phase 8: Blockers view

**Goal:** everything stuck, in one place.

- [ ] `/blockers` page: all nodes where `state = 'blocked'`, grouped by project
- [ ] Show project, node, how long it's been blocked, and the latest update on it
- [ ] Click through to the node in its project
- [ ] Blocker count badge in the nav

**Done when:** blocking a node anywhere shows it on this page.

---

## Phase 9: Board and timeline views

**Goal:** the same nodes, other angles.

- [ ] **Board tab:** columns by node state, drag a card to change state
- [ ] **Timeline tab:** nodes with a `due_date` on a simple horizontal calendar. Build it with plain CSS first. Add a library only if needed.
- [ ] Nodes with no date go in an "Unscheduled" strip

**Done when:** one project can be viewed as Checklist, Flow, Board, and Timeline with consistent data.

---

## Phase 10: Project list upgrades

**Goal:** progress readable at a glance, with no numbers.

- [ ] Tiny flow preview on each project card (small SVG of nodes colored by state)
- [ ] Filters: status, owner, has blockers
- [ ] Sort by last update
- [ ] **Activity page:** what changed today across all projects
- [ ] Empty states and loading skeletons

**Done when:** you can scan the list and know which projects need attention.

---

## Phase 11: Realtime and polish

**Goal:** the team sees changes live.

- [ ] Supabase Realtime on `updates`, `nodes`, `comments` (enable in the dashboard)
- [ ] Live feed and live node colors
- [ ] Mobile layout check
- [ ] Dark mode
- [ ] Rich text or markdown in updates (optional)
- [ ] Keyboard shortcut to post an update (optional)

---

## Phase 12: Deploy

- [ ] Deploy to Vercel or Netlify
- [ ] Add env vars
- [ ] Set Supabase Auth site URL and redirect URLs to the live domain
- [ ] Test sign-in with a teammate
- [ ] Back up the database occasionally (free plan has limited backups)

---

## Keep it free

- Use only Supabase free-tier features: Postgres, Auth, Realtime, RLS.
- Skip file uploads at first. Storage is limited on the free plan.
- Skip email notifications for v1. Add in-app activity first.
- Keep payloads small: paginate the updates feed.

---

## Later (not v1)

- Notifications (mentions, blocked alerts)
- Freeform drag-and-place flowchart
- Project templates
- File attachments
- Roles (admin vs viewer)
- Weekly summary page
