-- Courses stage 1: richer listings + free request-to-book.

alter type course_format add value if not exists 'private_group';

alter table courses
  add column if not exists booking_mode text not null default 'dates'
    check (booking_mode in ('dates', 'on_request', 'ongoing')),
  add column if not exists summary text,
  add column if not exists what_youll_make text,
  add column if not exists prerequisites text,
  add column if not exists included text[] not null default '{}',
  add column if not exists pieces_fired smallint,
  add column if not exists extras text,
  add column if not exists collection_info text,
  add column if not exists private_price_pence int check (private_price_pence >= 0),
  add column if not exists private_max_people smallint,
  add column if not exists schedule_text text,
  add column if not exists sessions_count smallint,
  add column if not exists cancellation_policy text not null default 'standard'
    check (cancellation_policy in ('flexible', 'standard', 'strict', 'custom')),
  add column if not exists cancellation_text text,
  add column if not exists external_booking_url text,
  add column if not exists image_paths text[] not null default '{}';

-- A bookable run can meet several times (e.g. a 5-week course).
alter table course_sessions
  add column if not exists meetings jsonb not null default '[]';

-- Only show dates for published courses.
drop policy if exists "sessions_public_read" on course_sessions;
create policy "sessions_public_read" on course_sessions for select
  using (course_id in (select id from courses where is_published = true));

create table if not exists booking_requests (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references courses(id) on delete cascade,
  session_id      uuid references course_sessions(id) on delete set null,
  potter_id       uuid not null references potters(id) on delete cascade,
  name            text not null,
  email           text not null,
  phone           text,
  places          int not null default 1 check (places between 1 and 50),
  preferred_dates text,
  message         text,
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  potter_note     text,
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);
create index if not exists booking_requests_potter_idx on booking_requests (potter_id, created_at desc);
create index if not exists booking_requests_session_idx on booking_requests (session_id, status);

-- All access goes through server code with the service role.
alter table booking_requests enable row level security;
