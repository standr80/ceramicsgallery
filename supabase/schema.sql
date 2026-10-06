-- ceramicsgallery.co.uk — Supabase / Postgres schema (v0.2)
-- One multi-tenant app: gallery, potter sites, pieces, courses, orders, bookings.
-- Money is stored in pence (integer). All timestamps are timestamptz.

create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────
create type piece_status   as enum ('draft', 'live', 'reserved', 'sold', 'archived');
create type order_status   as enum ('pending', 'paid', 'dispatched', 'collected', 'completed', 'refunded', 'cancelled');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'refunded');
create type course_format  as enum ('taster', 'one_day', 'weekend', 'weekly', 'one_to_one', 'online');
create type course_level   as enum ('beginner', 'improver', 'intermediate', 'advanced', 'all');

-- ─────────────────────────────────────────────
-- Potters (one per auth user)
-- ─────────────────────────────────────────────
create table potters (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references auth.users(id) on delete cascade,
  slug                 text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  display_name         text not null,
  studio_name          text,
  headline             text,
  bio                  text,
  bio_source_audio     text,
  avatar_path          text,
  location_label       text,
  location             geography(point, 4326),
  instagram            text,
  website_url          text,
  contact_email        text,
  studio_address       text,
  opening_hours        text,
  stripe_account_id    text unique,
  stripe_charges_ok    boolean not null default false,
  stripe_payouts_ok    boolean not null default false,
  plan                 text not null default 'free' check (plan in ('free', 'pro', 'studio')),
  commission_bps       int  not null default 1200,
  onboarding_step      text not null default 'profile',
  is_published         boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table potter_tax_details (
  potter_id            uuid primary key references potters(id) on delete cascade,
  legal_name           text not null,
  is_business          boolean not null default false,
  company_number       text,
  tax_reference        text,
  date_of_birth        date,
  primary_address      jsonb not null,
  vat_registered       boolean not null default false,
  collected_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Generated websites
-- ─────────────────────────────────────────────
create table sites (
  potter_id        uuid primary key references potters(id) on delete cascade,
  template         text not null default 'kiln',
  theme            jsonb not null default '{}',
  custom_domain    text unique,
  domain_verified  boolean not null default false,
  hero_piece_id    uuid references pieces(id) on delete set null,
  show_courses     boolean not null default true,
  show_shop        boolean not null default true,
  seo_title        text,
  seo_description  text,
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Pieces (pots for sale)
-- ─────────────────────────────────────────────
create table categories (
  id         smallserial primary key,
  slug       text not null unique,
  label      text not null,
  sort_order smallint not null default 0
);

create table shipping_bands (
  id                   smallserial primary key,
  code                 text not null unique,
  label                text not null,
  max_weight_g         int,
  max_longest_cm       numeric(5,1),
  default_price_pence  int not null
);

create table pieces (
  id                   uuid primary key default gen_random_uuid(),
  potter_id            uuid not null references potters(id) on delete cascade,
  status               piece_status not null default 'draft',
  title                text not null,
  description          text,
  category_id          smallint references categories(id),
  clay_body            text,
  glaze_notes          text,
  firing               text,
  height_cm            numeric(5,1),
  width_cm             numeric(5,1),
  depth_cm             numeric(5,1),
  weight_g             int,
  food_safe            boolean,
  price_pence          int check (price_pence >= 0),
  quantity             int not null default 1 check (quantity >= 0),
  shipping_band_id     smallint references shipping_bands(id),
  collection_available boolean not null default true,
  ai_draft             jsonb,
  ai_price_low_pence   int,
  ai_price_high_pence  int,
  search               tsvector generated always as (
                         setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
                         setweight(to_tsvector('english', coalesce(glaze_notes,'') || ' ' || coalesce(clay_body,'') || ' ' || coalesce(firing,'')), 'B') ||
                         setweight(to_tsvector('english', coalesce(description,'')), 'C')
                       ) stored,
  published_at         timestamptz,
  sold_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index pieces_potter_idx  on pieces (potter_id, status);
create index pieces_gallery_idx on pieces (status, published_at desc) where status = 'live';
create index pieces_search_idx  on pieces using gin (search);

create table piece_images (
  id             uuid primary key default gen_random_uuid(),
  piece_id       uuid not null references pieces(id) on delete cascade,
  position       smallint not null default 0,
  original_path  text not null,
  processed_path text,
  width          int,
  height         int,
  alt_text       text,
  created_at     timestamptz not null default now(),
  unique (piece_id, position)
);

-- ─────────────────────────────────────────────
-- Courses directory
-- ─────────────────────────────────────────────
create table courses (
  id               uuid primary key default gen_random_uuid(),
  potter_id        uuid not null references potters(id) on delete cascade,
  title            text not null,
  description      text,
  format           course_format not null,
  level            course_level not null default 'all',
  techniques       text[] not null default '{}',
  duration_minutes int,
  price_pence      int not null check (price_pence >= 0),
  deposit_pence    int check (deposit_pence >= 0),
  includes         text,
  venue_name       text,
  venue_address    text,
  location         geography(point, 4326),
  is_online        boolean not null default false,
  max_places       int not null default 6,
  min_age          smallint,
  is_published     boolean not null default false,
  search           tsvector generated always as (
                     setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
                     setweight(to_tsvector('english', coalesce(description,'')), 'C')
                   ) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index courses_location_idx on courses using gist (location);
create index courses_search_idx   on courses using gin (search);

create table course_sessions (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  places_total  int not null,
  places_booked int not null default 0,
  is_cancelled  boolean not null default false,
  check (ends_at > starts_at),
  check (places_booked <= places_total)
);
create index course_sessions_upcoming_idx on course_sessions (starts_at) where not is_cancelled;

-- ─────────────────────────────────────────────
-- Customers, orders, bookings
-- ─────────────────────────────────────────────
create table customers (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid unique references auth.users(id) on delete set null,
  email              text not null,
  name               text,
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

create table orders (
  id                      uuid primary key default gen_random_uuid(),
  potter_id               uuid not null references potters(id),
  customer_id             uuid not null references customers(id),
  piece_id                uuid not null references pieces(id),
  quantity                int not null default 1,
  status                  order_status not null default 'pending',
  fulfilment              text not null check (fulfilment in ('ship', 'collect')),
  item_pence              int not null,
  shipping_pence          int not null default 0,
  total_pence             int not null,
  application_fee_pence   int not null,
  stripe_checkout_session text unique,
  stripe_payment_intent   text unique,
  shipping_address        jsonb,
  tracking_ref            text,
  created_at              timestamptz not null default now(),
  paid_at                 timestamptz,
  dispatched_at           timestamptz
);
create index orders_potter_idx on orders (potter_id, created_at desc);

create table bookings (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid not null references course_sessions(id),
  customer_id             uuid not null references customers(id),
  places                  int not null default 1 check (places > 0),
  status                  booking_status not null default 'pending',
  amount_pence            int not null,
  application_fee_pence   int not null,
  stripe_checkout_session text unique,
  stripe_payment_intent   text unique,
  notes                   text,
  created_at              timestamptz not null default now()
);

create table stripe_events (
  id           text primary key,
  type         text not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);

create table contact_enquiries (
  id           uuid primary key default gen_random_uuid(),
  potter_id    uuid not null references potters(id) on delete cascade,
  course_id    uuid references courses(id) on delete set null,
  sender_name  text not null,
  sender_email text not null,
  message      text not null,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Business logic
-- ─────────────────────────────────────────────

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger set_updated_at before update on potters        for each row execute function touch_updated_at();
create trigger set_updated_at before update on sites          for each row execute function touch_updated_at();
create trigger set_updated_at before update on pieces         for each row execute function touch_updated_at();
create trigger set_updated_at before update on courses        for each row execute function touch_updated_at();

-- Called by the Stripe webhook handler after checkout.session.completed.
-- Signature matches app/api/webhooks/stripe/route.ts.
create or replace function mark_order_paid(
  p_checkout_session_id text,
  p_payment_intent_id   text
) returns void language plpgsql security definer as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order
  from orders
  where stripe_checkout_session = p_checkout_session_id
  for update;

  if not found then return; end if;
  if v_order.status != 'pending' then return; end if;

  update orders
  set status = 'paid',
      paid_at = now(),
      stripe_payment_intent = p_payment_intent_id
  where id = v_order.id;

  update pieces
  set status = 'sold',
      quantity = 0,
      sold_at = now()
  where id = v_order.piece_id;
end;
$$;

create or replace function sync_places() returns trigger language plpgsql as $$
begin
  update course_sessions
  set places_booked = (
    select coalesce(sum(places), 0)
    from bookings
    where session_id = coalesce(new.session_id, old.session_id)
      and status in ('pending', 'confirmed')
  )
  where id = coalesce(new.session_id, old.session_id);
  return new;
end;
$$;
create trigger sync_booking_places
after insert or update or delete on bookings
for each row execute function sync_places();

-- ─────────────────────────────────────────────
-- Public read views
-- ─────────────────────────────────────────────
create or replace view gallery_pieces as
select
  p.id,
  p.title,
  p.description,
  p.price_pence,
  p.height_cm,
  p.width_cm,
  p.clay_body,
  p.glaze_notes,
  p.firing,
  p.food_safe,
  p.collection_available,
  po.slug         as potter_slug,
  po.display_name as potter_name,
  po.location_label,
  c.label         as category,
  (select pi.original_path
   from piece_images pi
   where pi.piece_id = p.id
   order by pi.position limit 1) as cover_path,
  p.published_at
from pieces p
join potters po on po.id = p.potter_id
left join categories c on c.id = p.category_id
where p.status = 'live'
  and po.is_published = true;

create or replace view course_directory as
select
  co.id,
  co.title,
  co.description,
  co.format,
  co.level,
  co.techniques,
  co.duration_minutes,
  co.price_pence,
  co.deposit_pence,
  co.includes,
  co.venue_name,
  co.venue_address,
  co.location,
  co.is_online,
  po.slug         as potter_slug,
  po.display_name as potter_name,
  po.location_label,
  (select json_agg(json_build_object(
    'id', cs.id,
    'starts_at', cs.starts_at,
    'ends_at', cs.ends_at,
    'places_total', cs.places_total,
    'places_booked', cs.places_booked
  ) order by cs.starts_at)
   from course_sessions cs
   where cs.course_id = co.id
     and cs.starts_at > now()
     and not cs.is_cancelled
  ) as upcoming_sessions
from courses co
join potters po on po.id = co.potter_id
where co.is_published = true
  and po.is_published = true;

-- ─────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────
alter table potters            enable row level security;
alter table potter_tax_details enable row level security;
alter table sites              enable row level security;
alter table categories         enable row level security;
alter table shipping_bands     enable row level security;
alter table pieces             enable row level security;
alter table piece_images       enable row level security;
alter table courses            enable row level security;
alter table course_sessions    enable row level security;
alter table customers          enable row level security;
alter table orders             enable row level security;
alter table bookings           enable row level security;
alter table stripe_events      enable row level security;
alter table contact_enquiries  enable row level security;

create policy "potters_public_read"   on potters for select using (true);
create policy "potters_owner_insert"  on potters for insert with check (auth.uid() = user_id);
create policy "potters_owner_update"  on potters for update using (auth.uid() = user_id);

create policy "tax_owner" on potter_tax_details
  using (potter_id in (select id from potters where user_id = auth.uid()));

create policy "sites_public_read" on sites for select using (true);
create policy "sites_owner_write" on sites for all
  using (potter_id in (select id from potters where user_id = auth.uid()));

create policy "cats_public"     on categories     for select using (true);
create policy "shipping_public" on shipping_bands for select using (true);

create policy "pieces_public_read" on pieces for select using (status = 'live');
create policy "pieces_owner_all"   on pieces for all
  using (potter_id in (select id from potters where user_id = auth.uid()));

create policy "pi_public_read" on piece_images for select
  using (piece_id in (select id from pieces where status = 'live'));
create policy "pi_owner_all"   on piece_images for all
  using (piece_id in (select id from pieces where potter_id in (
    select id from potters where user_id = auth.uid())));

create policy "courses_public_read" on courses for select using (is_published = true);
create policy "courses_owner_all"   on courses for all
  using (potter_id in (select id from potters where user_id = auth.uid()));

create policy "sessions_public_read" on course_sessions for select using (true);
create policy "sessions_owner_all"   on course_sessions for all
  using (course_id in (select id from courses where potter_id in (
    select id from potters where user_id = auth.uid())));

create policy "customers_own" on customers
  using (user_id = auth.uid());

create policy "orders_customer" on orders for select
  using (customer_id in (select id from customers where user_id = auth.uid()));
create policy "orders_potter"   on orders for select
  using (potter_id in (select id from potters where user_id = auth.uid()));

create policy "bookings_customer" on bookings for select
  using (customer_id in (select id from customers where user_id = auth.uid()));
create policy "bookings_potter"   on bookings for select
  using (session_id in (
    select cs.id from course_sessions cs
    join courses co on co.id = cs.course_id
    where co.potter_id in (select id from potters where user_id = auth.uid())));

create policy "stripe_events_deny" on stripe_events using (false);

create policy "enquiries_insert" on contact_enquiries for insert with check (true);
create policy "enquiries_potter" on contact_enquiries for select
  using (potter_id in (select id from potters where user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────
insert into categories (slug, label, sort_order) values
  ('mugs',        'Mugs',          1),
  ('bowls',       'Bowls',         2),
  ('plates',      'Plates',        3),
  ('vases',       'Vases',         4),
  ('jugs',        'Jugs',          5),
  ('teapots',     'Teapots',       6),
  ('decorative',  'Decorative',    7),
  ('sculpture',   'Sculpture',     8),
  ('tableware',   'Tableware',     9),
  ('other',       'Other',        99)
on conflict (slug) do nothing;

insert into shipping_bands (code, label, max_weight_g, max_longest_cm, default_price_pence) values
  ('small',   'Small parcel',   2000,   45.0,  595),
  ('medium',  'Medium parcel',  5000,   61.0,  895),
  ('large',   'Large parcel',  20000,  100.0, 1295),
  ('collect', 'Collection only', null,  null,    0)
on conflict (code) do nothing;

-- ─────────────────────────────────────────────
-- Storage
-- ─────────────────────────────────────────────
-- piece-images bucket: public read, authenticated upload
-- Create via Supabase dashboard or:
--   insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   values ('piece-images','piece-images',true,10485760,
--           array['image/jpeg','image/png','image/webp','image/heic']);

-- contact_email is private: hidden from anon/authenticated; read server-side via service role.
revoke select on potters from anon, authenticated;
grant select (id, user_id, slug, display_name, studio_name, headline, bio, bio_source_audio,
  avatar_path, location_label, location, instagram, website_url, studio_address, opening_hours,
  stripe_account_id, stripe_charges_ok, stripe_payouts_ok, plan, commission_bps, onboarding_step,
  is_published, created_at, updated_at) on potters to anon, authenticated;
