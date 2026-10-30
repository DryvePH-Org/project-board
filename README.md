# Pulseboard

A shared, dead-simple project tracker built for daily use: one list of projects, click one to see its progress, updates and blockers. No login, no dashboards to learn.

**Stack:** Next.js 15 · React 19 · TypeScript · Supabase (Postgres) · Vercel — all free tiers.

---

## What it does

| Screen | What you get |
|---|---|
| **Projects** (home) | One row per project: name, health/blocker pill, latest update summary, stage, owner, progress %, due date and a thin progress bar. Sorted active-first, then most recently updated. |
| **Project detail** | Header with status, description, owner, due date, hours logged and progress. Inline “Today’s update” composer, inline blockers (add / resolve / delete), full update history, and edit/delete. |

Daily updates capture: what moved · progress % · status, with optional date · reporter · hours · next step · blocker note under **More options**.
Saving an update updates the project's progress and status automatically (a Postgres trigger keeps it consistent).

Keyboard: `n` = new project, `u` = log update, `Esc` = close dialog.

---

## Quick start (demo mode, no signup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables the app runs in **demo mode**: seeded example data stored in your browser's local storage. Everything is clickable and testable. Changes are not shared with anyone.

---

## Connect Supabase (≈5 minutes, free)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
   Optional: run `supabase/seed.sql` to load example data.
3. Copy **Project URL** and the **anon public** key from **Project Settings → API**.
4. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_TEAM_NAME=My Team
```

5. Restart `npm run dev`. The yellow demo strip disappears once data is coming from Supabase.

The app polls the database every 60 seconds while the tab is visible, so teammates see changes without reloading. The whole `/setup` page inside the app repeats these instructions for anyone else on the team.

### Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as Next.js; no build settings needed.
3. Add the three environment variables above (Production + Preview), then **Deploy**.
4. Share the resulting `*.vercel.app` URL with the team.

Any static/free host works in demo mode, but Supabase needs a Node-capable host — Vercel's Hobby plan is free and more than enough.

---

## Data model

```
projects   id · name · description · owner · stage · priority · status
           start_date · due_date · progress · color · archived · timestamps

updates    id · project_id → projects · update_date · status · progress
           hours · summary · next_step · blockers_note · author · created_at

blockers   id · project_id → projects · title · detail · severity
           status (open|resolved) · owner · created_at · resolved_at
```

`supabase/schema.sql` also creates:
- indexes for list and detail queries,
- `touch_updated_at()` on projects,
- `sync_project_from_update()` — a trigger that copies the newest update's progress/status onto its project, and flips the stage to `done` when the update says done.

---

## Customising your workflow

Stage names, order, and hints live in one place: `src/lib/constants.ts`.

```ts
export const STAGES = [
  { id: "backlog",     label: "Backlog",     hint: "Not started yet" },
  { id: "planning",    label: "Planning",    hint: "Scoping and scheduling" },
  { id: "in_progress", label: "In Progress", hint: "Actively being worked" },
  { id: "review",      label: "Review",      hint: "Awaiting feedback or QA" },
  { id: "launch",      label: "Launch",      hint: "Shipping this week" },
  { id: "done",        label: "Done",        hint: "Delivered and closed" },
];
```

If you add or rename a stage, update the `check` constraint in `schema.sql` (and run the altered statement) so the database accepts it. Project colours are in `PROJECT_COLORS` in the same file.

---

## Free-tier reality check

| Service | Free tier | What it means here |
|---|---|---|
| Supabase | 500 MB Postgres, 2 projects, pauses after 7 days with no API traffic | Daily use keeps it awake; restore from the dashboard if it ever pauses. No data loss. |
| Vercel | Hobby: 100 GB bandwidth/month | Plenty for an internal tool. |
| Custom domain | Optional | `*.vercel.app` is free. |

---

## Security (read this before sharing the link)

There is **no authentication by design**. The anonymous key ships to the browser with read/write policies, so anyone with the URL can edit your data. That's a normal trade-off for a small internal tool, but it is not suitable for sensitive client data.

Options, in order of effort:

1. **Keep the URL private.** Fine for a trusted team.
2. **Enable Supabase Auth** (email magic links) and change the RLS policies from `anon` to `authenticated`. Comments at the bottom of `schema.sql` show the exact policies.
3. **Add a shared passcode** in front of writes with a Next.js route handler and the service-role key (do not expose the service key to the client).

---

## Project layout

```
src/
  app/
    page.tsx                 Projects list (the home screen)
    projects/[id]/page.tsx   Project detail: composer, blockers, updates
    setup/page.tsx           In-app setup guide + connection check
    layout.tsx, globals.css  Shell and design system
  components/                AppShell, project/update forms, UI primitives
  lib/
    types.ts                 Domain types + Repository interface
    constants.ts             Stages, statuses, severities, colours
    analytics.ts             Latest update, blockers, health
    store.tsx                React context, mutations, polling, toasts
    supabaseRepo.ts          Supabase adapter (snake_case ↔ camelCase)
    demoRepo.ts              Local-storage adapter with seed data
supabase/
  schema.sql                 Tables, indexes, triggers, RLS
  seed.sql                   Optional demo rows
```

The `Repository` interface means the UI never talks to Supabase directly. Adding a different backend (Airtable, SQLite, an API you own) is a single new adapter file.
