-- Courses table for potter-run workshops and classes
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  potter_id uuid not null references potters(id) on delete cascade,
  title text not null,
  description text not null,
  type text,
  start_date date,
  end_date date,
  price numeric(10,2) not null default 0,
  currency text not null default 'GBP',
  duration text,
  skill_level text,
  location text,
  max_participants integer,
  active boolean not null default true,
  source text not null default 'manual',
  created_at timestamptz default now()
);

create index if not exists courses_potter_id on courses(potter_id);
create index if not exists courses_source on courses(source);

alter table courses enable row level security;

create policy "Public can read active courses" on courses
  for select using (active = true);

create policy "Potters can manage own courses" on courses
  for all using (potter_id in (
    select id from potters where auth_user_id = auth.uid()
  ));
