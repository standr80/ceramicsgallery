create table if not exists contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  potter_id uuid references potters(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists contact_enquiries_potter_id on contact_enquiries(potter_id);

alter table contact_enquiries enable row level security;

-- Only admins (service role) can read enquiries; potters cannot read via RLS
-- (admin panel uses service role key which bypasses RLS)
