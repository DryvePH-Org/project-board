# Pulseboard

A shared, dead-simple project tracker: a list of projects, and inside each one a freeform board where
you drop blocks for the steps and connect them to show how the project flows — think a lightweight
ManyChat-style canvas, not a Gantt chart.

**Stack:** Next.js 15 · React 19 · TypeScript · Supabase (Postgres) · `@xyflow/react` · Vercel — all free tiers.

---

## What it does

| Screen | What you get |
|---|---|
| **Projects** (home) | A two-column grid of cards: name, status pill, owner, block count, and when it was last touched. |
| **Project → Overview** | The project's description, status, owner, and a couple of quick stats. Edit or delete the project from here. |
| **Project → Freeform board** | A full-screen canvas of draggable blocks. Add a block, drag it anywhere (position is saved), pull from its edge to another block to link them, click a block to comment/suggest, add a note, or change its state. Flag any link as blocked with a reason, right on the line. |

Lines animate to show flow direction, and turn red when flagged as blocked. A recenter button finds your
blocks again if you've panned or zoomed away. "Exit full screen" returns to the normal project page.

Keyboard: `n` = new project, `Esc` = close a dialog.

---

## Quick start (demo mode, no signup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables the app runs in **demo mode**: seeded example
data stored in your browser's local storage. Everything is clickable and testable. Changes are not shared
with anyone.

---

## Connect Supabase (≈5 minutes, free)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Apply the SQL. Either from the dashboard (**SQL Editor → New query**, paste `supabase/schema.sql`,
   **Run** — read the comment at the top first, it has you add your own email to the team allowlist
   before anyone can sign up) — or from the command line:

   ```bash
   # .env.local needs DATABASE_URL (Project Settings → Database → Connection string, Direct)
   npm run migrate
   ```

   Safe to re-run. Optionally load a couple of example projects with `supabase/seed.sql`.
3. Copy **Project URL** and the **anon public** key from **Project Settings → API**.
4. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_TEAM_NAME=My Team
```

5. Point the magic-link email template at the app: **Authentication → Email Templates → Magic Link**,
   and make sure the link is `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}`.
   The default template uses `{{ .ConfirmationURL }}`, which lands on the site root and drops the
   token — sign-in appears to do nothing.
6. Restart `npm run dev`. The yellow demo strip disappears once data is coming from Supabase.

The app polls the database every 60 seconds while the tab is visible, so teammates see changes without
reloading. The `/setup` page inside the app repeats these instructions for anyone else on the team.

### Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as Next.js; no build
   settings needed.
3. Add the three environment variables above (Production + Preview), then **Deploy**.
4. Share the resulting `*.vercel.app` URL with the team.

---

## Data model

```
projects   id · name · description · owner · status (on_track|at_risk|blocked|done)
           color · archived · timestamps

nodes      id · project_id → projects · title · note
           state (idea|planned|in_progress|blocked|done) · position_x · position_y · created_at

edges      id · project_id → projects · source_id → nodes · target_id → nodes
           blocked · blocker_note · created_at

comments   id · node_id → nodes · project_id → projects · body · author · created_at
```

A node's `position_x`/`position_y` is the only "layout" — the board is freeform, not auto-arranged.
Dragging a block persists its new position.

---

## Customising

Project statuses and node states live in `src/lib/constants.ts`. Project card colours are in
`PROJECT_COLORS` in the same file.

---

## Free-tier reality check

| Service | Free tier | What it means here |
|---|---|---|
| Supabase | 500 MB Postgres, 2 projects, pauses after 7 days with no API traffic | Daily use keeps it awake; restore from the dashboard if it ever pauses. No data loss. |
| Vercel | Hobby: 100 GB bandwidth/month | Plenty for an internal tool. |
| Custom domain | Optional | `*.vercel.app` is free. |

---

## Security

Sign-in is required. `schema.sql` sets up:

- Supabase Auth (email magic links), with `middleware.ts` redirecting signed-out visitors to `/login`.
- A `profiles` table, filled automatically on signup by a trigger.
- A team allowlist (`allowed_emails`): sign-ups from any other email are rejected. Add your team's
  emails there before sharing the link.
- RLS policies on `projects` / `nodes` / `edges` scoped to `authenticated`.

Demo mode (no env vars) has no login — it's local-only, nothing to protect.

---

## Project layout

```
src/
  app/
    page.tsx                        Projects list (the home screen)
    projects/[id]/page.tsx          Project detail: sidebar + overview/board
    setup/page.tsx                  In-app setup guide + connection check
    layout.tsx, globals.css         Shell and design system
  components/
    AppShell.tsx, ProjectForm.tsx   App chrome, project create/edit
    project/                        ProjectNav, ProjectHeader, Overview + board modules
    flow/                           FlowCanvas (React Flow), FlowNode, NodeInspector
  lib/
    types.ts                        Domain types + Repository interface
    constants.ts                    Statuses, node states, colours
    flow.ts                         React Flow <-> ProjectNode/ProjectEdge mapping
    analytics.ts                    Small per-project selectors
    store.tsx                       React context, mutations, polling, toasts
    supabaseRepo.ts                 Supabase adapter (snake_case ↔ camelCase)
    demoRepo.ts                     Local-storage adapter with seed data
supabase/
  schema.sql                        Auth, projects, nodes, edges, RLS — one file
  seed.sql                          Optional demo rows
scripts/
  migrate.js                        Runs schema.sql (+ seed.sql if present) via DATABASE_URL
```

The `Repository` interface means the UI never talks to Supabase directly. Adding a different backend
(Airtable, SQLite, an API you own) is a single new adapter file.
