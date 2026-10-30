-- ============================================================
--  Optional demo data
--  Run after schema.sql if you want a couple of example projects
--  with a small board already mapped out.
--  Delete these later from the app (Projects → trash icon).
-- ============================================================

insert into public.projects (id, name, description, owner, status, color)
values
  ('11111111-1111-4111-8111-111111111111',
   'Website redesign',
   'Marketing site rebuild with a lightweight CMS so the client can publish without us.',
   'Aaron', 'on_track', '#4f46e5'),
  ('22222222-2222-4222-8222-222222222222',
   'Q4 campaign launch',
   'Paid social, email sequence and a landing page. Creative approved; copy waiting on legal.',
   'Maya', 'at_risk', '#db2777')
on conflict (id) do nothing;

insert into public.nodes (id, project_id, title, note, state, position_x, position_y)
values
  ('aaaaaaaa-0001-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'Kickoff call', 'Align on scope and timeline with the client.', 'done', 40, 140),
  ('aaaaaaaa-0002-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'Design system tokens', '', 'done', 320, 60),
  ('aaaaaaaa-0003-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'Homepage build', '', 'in_progress', 320, 240),
  ('aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'Client review', 'Walk through the homepage and gather feedback.', 'planned', 620, 150),
  ('bbbbbbbb-0001-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222',
   'Legal review', 'Three ad headlines reference performance numbers legal must verify.', 'blocked', 60, 120),
  ('bbbbbbbb-0002-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222',
   'Schedule campaign', '', 'idea', 360, 120)
on conflict (id) do nothing;

insert into public.edges (project_id, source_id, target_id, blocked, blocker_note)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0001-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0002-4aaa-8aaa-aaaaaaaaaaaa', false, ''),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0001-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0003-4aaa-8aaa-aaaaaaaaaaaa', false, ''),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0002-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', false, ''),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0003-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0004-4aaa-8aaa-aaaaaaaaaaaa', true,
    'Waiting on final copy from marketing before this can move.'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0001-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-0002-4bbb-8bbb-bbbbbbbbbbbb', false, '')
on conflict (source_id, target_id) do nothing;

insert into public.comments (id, node_id, project_id, body, author)
values
  ('cccccccc-0001-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-0003-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'Should we use the new hero photo here instead of the placeholder?', 'Maya')
on conflict (id) do nothing;
