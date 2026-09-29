-- riaayahBMR — Supabase schema
-- Run this once in your project's SQL Editor (Supabase dashboard > SQL Editor > New query > Run).

-- 1. Admins allow-list. Only emails in here can approve/reject submissions.
create table if not exists admins (
  email text primary key
);

-- Add yourself as the first admin (replace with your real email), e.g.:
-- insert into admins (email) values ('you@example.com');

-- 2. Public submissions. Anyone can insert; only approved rows are publicly
--    readable; only admins can read pending/rejected rows or change status.
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  layer_id text not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_note text
);

alter table submissions enable row level security;

-- Anyone (including anonymous visitors) can submit a new pending location.
create policy "public can insert submissions"
  on submissions for insert
  to anon, authenticated
  with check (status = 'pending');

-- Anyone can read approved submissions (this is what powers the public map).
create policy "public can read approved submissions"
  on submissions for select
  to anon, authenticated
  using (status = 'approved');

-- Only allow-listed admins can read every submission (including pending).
create policy "admins can read all submissions"
  on submissions for select
  to authenticated
  using (exists (select 1 from admins where admins.email = auth.jwt() ->> 'email'));

-- Only allow-listed admins can approve/reject (update status).
create policy "admins can update submissions"
  on submissions for update
  to authenticated
  using (exists (select 1 from admins where admins.email = auth.jwt() ->> 'email'))
  with check (exists (select 1 from admins where admins.email = auth.jwt() ->> 'email'));

-- Also enable RLS on admins itself so the allow-list can't be read/edited by anyone
-- except via the Supabase dashboard (service role bypasses RLS).
alter table admins enable row level security;
