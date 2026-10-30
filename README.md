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
2. Apply the SQL. Either from the dashboard (**SQL Editor → New query**, paste a file, **Run**)
   in this order — `supabase/schema.sql`, then `supabase/phase1_auth.sql` (read the comment at the
   top first: it has you add your own email to the team allowlist before anyone can sign up),
   then `supabase/phase4_nodes.sql` — or from the command line:

   ```bash
   # .env.local needs DATABASE_URL (Project Settings → Database → Connection string, Direct)
   npm run migrate
   ```

   All three files are safe to re-run. Optionally load example rows with `supabase/seed.sql`.
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

nodes      id · project_id → projects · title · note · kind (step|milestone|question)
           state (idea|planned|in_progress|blocked|done) · due_date · created_by · created_at
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

## Security

Sign-in is required. After `schema.sql`, also run `supabase/phase1_auth.sql` in the SQL editor — it adds:

- Supabase Auth (email magic links), with `middleware.ts` redirecting signed-out visitors to `/login`.
- A `profiles` table, filled automatically on signup by a trigger.
- A team allowlist (`allowed_emails`): sign-ups from any other email are rejected. Add your team's emails there before sharing the link.
- RLS policies on `projects` / `updates` / `blockers` scoped to `authenticated`, replacing the original anon-write policies.

Demo mode (no env vars) has no login — it's local-only, nothing to protect.

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
