-- ============================================================
--  Optional demo data
--  Run after schema.sql if you want a few example projects.
--  Delete these later from the app (Projects → trash icon).
-- ============================================================

insert into public.projects (id, name, description, owner, stage, priority, status, start_date, due_date, progress, color)
values
  ('11111111-1111-4111-8111-111111111111',
   'Website redesign',
   'Marketing site rebuild with a lightweight CMS so the client can publish without us.',
   'Aaron', 'in_progress', 'high', 'on_track',
   current_date - 24, current_date + 9, 62, '#4f46e5'),
  ('22222222-2222-4222-8222-222222222222',
   'Q4 campaign launch',
   'Paid social, email sequence and a landing page. Creative approved; copy waiting on legal.',
   'Maya', 'review', 'high', 'at_risk',
   current_date - 18, current_date + 4, 78, '#db2777'),
  ('33333333-3333-4333-8333-333333333333',
   'Client onboarding revamp',
   'Replace ad-hoc onboarding emails with a documented 30-day journey.',
   'Dan', 'planning', 'medium', 'on_track',
   current_date - 6, current_date + 21, 25, '#0d9488')
on conflict (id) do nothing;

insert into public.updates (id, project_id, update_date, status, progress, hours, summary, next_step, blockers_note, author)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111', current_date, 'on_track', 62, 5.5,
   'Homepage and services template are built and responsive. Client asked for a warmer hero photo treatment.',
   'Swap hero imagery, then build the case-study template.', '', 'Aaron'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '22222222-2222-4222-8222-222222222222', current_date, 'at_risk', 78, 3,
   'Email sequence assembled in the ESP. Legal still has not returned the approved claims list.',
   'Escalate to the client''s legal contact; prepare a fallback version.',
   'Legal approval pending since Monday.', 'Maya'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',
   '33333333-3333-4333-8333-333333333333', current_date - 1, 'on_track', 25, 4,
   'Mapped the current onboarding flow with delivery. Found three handoff gaps and one duplicate email.',
   'Draft the 30-day journey in a shared doc.', '', 'Dan')
on conflict (id) do nothing;

insert into public.blockers (id, project_id, title, detail, severity, status, owner)
values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   '22222222-2222-4222-8222-222222222222',
   'Legal has not approved campaign claims',
   'Three ad headlines reference performance numbers that legal must verify.',
   'critical', 'open', 'Maya')
on conflict (id) do nothing;

-- Re-sync progress from the updates above
update public.updates set progress = progress;
