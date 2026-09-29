-- ceramicsgallery.co.uk — Supabase / Postgres schema (v0.1)
-- One multi-tenant app: gallery, potter sites, pieces, courses, orders, bookings.
-- Money is stored in pence (integer). All timestamps are timestamptz.

create extension if not exists "pgcrypto";
create extension if not exists "postgis";   -- course/location search ("near me")

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
  slug                 text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),  -- also the subdomain
  display_name         text not null,
  studio_name          text,
  headline             text,                       -- one-liner under their name
  bio                  text,                       -- AI-drafted from voice note, potter-approved
  bio_source_audio     text,                       -- storage path of original voice note
  avatar_path          text,
  location_label       text,                       -- "Bury St Edmunds, Suffolk"
  location             geography(point, 4326),
  instagram            text,
  website_url          text,
  -- Stripe Connect (Express)
  stripe_account_id    text unique,
  stripe_charges_ok    boolean not null default false,
  stripe_payouts_ok    boolean not null default false,
  -- Plan / billing
  plan                 text not null default 'free' check (plan in ('free', 'pro', 'studio')),
  commission_bps       int  not null default 1200,  -- 12.00% default, overridable per potter
  onboarding_step      text not null default 'profile',
  is_published         boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Seller details required for HMRC digital platform reporting.
-- Kept in a separate table with tighter RLS; never exposed publicly.
create table potter_tax_details (
  potter_id            uuid primary key references potters(id) on delete cascade,
  legal_name           text not null,
  is_business          boolean not null default false,
  company_number       text,
  tax_reference        text,                        -- UTR / NI number / VAT number as applicable
  date_of_birth        date,
  primary_address      jsonb not null,
  vat_registered       boolean not null default false,
  collected_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Generated websites
-- ─────────────────────────────────────────────
create table sites (
  potter_id            uuid primary key references potters(id) on delete cascade,
  template             text not null default 'kiln',   -- template key
  theme                jsonb not null default '{}',    -- colours, fonts, layout choices
  custom_domain        text unique,                    -- pro plan; verified via Vercel domains API
  domain_verified      boolean not null default false,
  hero_piece_id        uuid,                           -- FK added below
  show_courses         boolean not null default true,
  show_shop            boolean not null default true,
  seo_title            text,
  seo_description      text,
  updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Pieces (pots for sale)
-- ─────────────────────────────────────────────
create table categories (
  id                   smallserial primary key,
  slug                 text not null unique,           -- vase, bowl, mug, plate, jar, sculpture...
  label                text not null,
  sort_order           smallint not null default 0
);

create table shipping_bands (
  id                   smallserial primary key,
  code                 text not null unique,           -- small / medium / large / collection_only
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
  firing               text,                           -- "cone 10 reduction", "raku", "wood fired"
  height_cm            numeric(5,1),
  width_cm             numeric(5,1),
  depth_cm             numeric(5,1),
  weight_g             int,
  food_safe            boolean,
  price_pence          int check (price_pence >= 0),
  quantity             int not null default 1 check (quantity >= 0),  -- 1 = one-of-a-kind
  shipping_band_id     smallint references shipping_bands(id),
  collection_available boolean not null default true,
  ai_draft             jsonb,                          -- raw AI suggestion, kept for comparison/training
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

alter table sites add constraint sites_hero_piece_fk
  foreign key (hero_piece_id) references pieces(id) on delete set null;

create table piece_images (
  id                   uuid primary key default gen_random_uuid(),
  piece_id             uuid not null references pieces(id) on delete cascade,
  position             smallint not null default 0,
  original_path        text not null,                  -- as uploaded
  processed_path       text,                           -- background cleaned / cropped
  width                int,
  height               int,
  alt_text             text,                           -- AI-drafted, for accessibility and SEO
  created_at           timestamptz not null default now(),
  unique (piece_id, position)
);

-- ─────────────────────────────────────────────
-- Courses directory
-- ─────────────────────────────────────────────
create table courses (
  id                   uuid primary key default gen_random_uuid(),
  potter_id            uuid not null references potters(id) on delete cascade,
  title                text not null,
  description          text,
  format               course_format not null,
  level                course_level not null default 'all',
  techniques           text[] not null default '{}',   -- wheel, handbuilding, glazing, raku...
  duration_minutes     int,
  price_pence          int not null check (price_pence >= 0),
  deposit_pence        int check (deposit_pence >= 0),
  includes             text,                           -- "clay, glazing and firing included"
  venue_name           text,
  venue_address        text,
  location             geography(point, 4326),         -- null when online
  is_online            boolean not null default false,
  max_places           int not null default 6,
  min_age              smallint,
  is_published         boolean not null default false,
  search               tsvector generated always as (
                         setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
                         setweight(to_tsvector('english', coalesce(description,'')), 'C')
                       ) stored,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index courses_location_idx on courses using gist (location);
create index courses_search_idx   on courses using gin (search);

create table course_sessions (
  id                   uuid primary key default gen_random_uuid(),
  course_id            uuid not null references courses(id) on delete cascade,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  places_total         int not null,
  places_booked        int not null default 0,
  is_cancelled         boolean not null default false,
  check (ends_at > starts_at),
  check (places_booked <= places_total)
);
create index course_sessions_upcoming_idx on course_sessions (starts_at) where not is_cancelled;

-- ─────────────────────────────────────────────
-- Customers, orders, bookings
-- ─────────────────────────────────────────────
create table customers (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid unique references auth.users(id) on delete set null,  -- guest checkout allowed
  email                text not null,
  name                 text,
  stripe_customer_id   text,
  created_at           timestamptz not null default now()
);

create table orders (
  id                        uuid primary key default gen_random_uuid(),
  potter_id                 uuid not null references potters(id),
  customer_id               uuid not null references customers(id),
  piece_id                  uuid not null references pieces(id),
  quantity                  int not null default 1,
  status                    order_status not null default 'pending',
  fulfilment                text not null check (fulfilment in ('ship', 'collect')),
  item_pence                int not null,
  shipping_pence            int not null default 0,
  total_pence               int not null,
  application_fee_pence     int not null,              -- platform commission
  stripe_checkout_session   text unique,
  stripe_payment_intent     text unique,
  shipping_address          jsonb,
  tracking_ref              text,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  dispatched_at             timestamptz
);
create index orders_potter_idx on orders (potter_id, created_at desc);

create table bookings (
  id                        uuid primary key default gen_random_uuid(),
  session_id                uuid not null references course_sessions(id),
  customer_id               uuid not null references customers(id),
  places                    int not null default 1 check (places > 0),
  status                    booking_status not null default 'pending',
  amount_pence              int not null,              -- deposit or full price
  application_fee_pence     int not null,
  stripe_checkout_session   text unique,
  stripe_payment_intent     text unique,
  notes                     text,                      -- dietary / accessibility, from the customer
  created_at                timestamptz not null default now()
);

-- Stripe webhook idempotency
create table stripe_events (
  id                   text primary key,               -- evt_...
  type                 text not null,
  received_at          timestamptz not null default now(),
  processed_at         timestamptz
);

-- ─────────────────────────────────────────────
-- Business logic
-- ─────────────────────────────────────────────

-- Mark one-off pieces sold the moment payment lands (call from the webhook).
create or replace function mark_order_paid(p_order_id uuid) returns void
language plpgsql security definer as $$
declare v_piece uuid; v_qty int;
begin
  update orders set status = 'paid', paid_at = now()
   where id = p_order_id and status = 'pending'
   returning piece_id, quantity into v_piece, v_qty;
  if v_piece is null then return; end if;
  update pieces
     set quantity = greatest(quantity - v_qty, 0),
         status   = case when quantity - v_qty <= 0 then 'sold'::piece_status else status end,
         sold_at  = case when quantity - v_qty <= 0 then now() else sold_at end
   where id = v_piece;
end $$;

-- Keep course session places in step with confirmed bookings.
create or replace function sync_places() returns trigger
language plpgsql as $$
begin
  update course_sessions s
     set places_booked = coalesce((select sum(places) from bookings b
                                   where b.session_id = s.id and b.status = 'confirmed'), 0)
   where s.id = coalesce(new.session_id, old.session_id);
  return null;
end $$;
create trigger bookings_sync_places after insert or update or delete on bookings
  for each row execute function sync_places();

-- updated_at helper
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger potters_touch before update on potters for each row execute function touch_updated_at();
create trigger pieces_touch  before update on pieces  for each row execute function touch_updated_at();
create trigger courses_touch before update on courses for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────
-- Public read views (what the gallery and potter sites query)
-- ─────────────────────────────────────────────
create view gallery_pieces as
select p.id, p.title, p.description, p.price_pence, p.height_cm, p.width_cm,
       p.glaze_notes, p.firing, p.published_at, c.slug as category,
       po.slug as potter_slug, po.display_name as potter_name, po.location_label,
       (select coalesce(i.processed_path, i.original_path) from piece_images i
         where i.piece_id = p.id order by i.position limit 1) as cover_image
from pieces p
join potters po on po.id = p.potter_id and po.is_published and po.stripe_charges_ok
left join categories c on c.id = p.category_id
where p.status = 'live';

create view course_directory as
select co.id, co.title, co.format, co.level, co.techniques, co.price_pence,
       co.is_online, co.location, co.venue_name,
       po.slug as potter_slug, po.display_name as potter_name,
       s.id as session_id, s.starts_at, s.ends_at,
       s.places_total - s.places_booked as places_left
from courses co
join potters po on po.id = co.potter_id and po.is_published
join course_sessions s on s.course_id = co.id
where co.is_published and not s.is_cancelled and s.starts_at > now();

-- ─────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────
alter table potters            enable row level security;
alter table potter_tax_details enable row level security;
alter table sites              enable row level security;
alter table pieces             enable row level security;
alter table piece_images       enable row level security;
alter table courses            enable row level security;
alter table course_sessions    enable row level security;
alter table orders             enable row level security;
alter table bookings           enable row level security;
alter table customers          enable row level security;

create or replace function my_potter_id() returns uuid
language sql stable security definer as $$
  select id from potters where user_id = auth.uid()
$$;

-- Public can read published potters, live pieces, published courses
create policy potters_public_read on potters for select using (is_published);
create policy pieces_public_read  on pieces  for select using (status in ('live', 'sold'));
create policy images_public_read  on piece_images for select using (
  exists (select 1 from pieces p where p.id = piece_id and p.status in ('live', 'sold')));
create policy courses_public_read  on courses for select using (is_published);
create policy sessions_public_read on course_sessions for select using (
  exists (select 1 from courses c where c.id = course_id and c.is_published));
create policy sites_public_read on sites for select using (true);

-- Potters manage their own records
create policy potters_own   on potters            for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tax_own       on potter_tax_details for all using (potter_id = my_potter_id()) with check (potter_id = my_potter_id());
create policy sites_own     on sites              for all using (potter_id = my_potter_id()) with check (potter_id = my_potter_id());
create policy pieces_own    on pieces             for all using (potter_id = my_potter_id()) with check (potter_id = my_potter_id());
create policy images_own    on piece_images       for all using (
  exists (select 1 from pieces p where p.id = piece_id and p.potter_id = my_potter_id()));
create policy courses_own   on courses            for all using (potter_id = my_potter_id()) with check (potter_id = my_potter_id());
create policy sessions_own  on course_sessions    for all using (
  exists (select 1 from courses c where c.id = course_id and c.potter_id = my_potter_id()));

-- Potters see their own orders and bookings; writes happen server-side (service role) from Stripe webhooks
create policy orders_potter_read   on orders   for select using (potter_id = my_potter_id());
create policy bookings_potter_read on bookings for select using (
  exists (select 1 from course_sessions s join courses c on c.id = s.course_id
          where s.id = session_id and c.potter_id = my_potter_id()));
create policy customers_self_read  on customers for select using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- Seed data
-- ─────────────────────────────────────────────
insert into categories (slug, label, sort_order) values
  ('vase','Vases',1), ('bowl','Bowls',2), ('mug','Mugs & cups',3), ('plate','Plates',4),
  ('jar','Jars & lidded',5), ('teapot','Teapots',6), ('sculpture','Sculpture',7), ('other','Other',99);

insert into shipping_bands (code, label, max_weight_g, max_longest_cm, default_price_pence) values
  ('small','Small (mug, cup)',1000,20,0),
  ('medium','Medium (bowl, vase)',3000,35,0),
  ('large','Large (platter, jar)',10000,60,0),
  ('collection_only','Collection only',null,null,0);
-- Set real shipping prices once you've chosen a courier.
