-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- Creates tables for potters (linked to auth) and products, plus storage bucket.

-- Potters: one record per signed-up potter, linked to auth.users
create table if not exists potters (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  biography text not null,
  image text,
  website text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products: belong to a potter
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  potter_id uuid not null references potters(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null,
  description_extended text,
  price numeric(10,2) not null,
  currency text not null default 'GBP',
  image text not null,
  images text[] default '{}',
  featured boolean default false,
  active boolean not null default true,
  category text,
  sku text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(potter_id, slug)
);

-- Indexes for lookups
create index if not exists potters_auth_user_id on potters(auth_user_id);
create index if not exists potters_slug on potters(slug);
create index if not exists products_potter_id on products(potter_id);
create index if not exists products_featured on products(featured) where featured = true;
create index if not exists products_category on products(category) where category is not null;

-- RLS: potters can only read/update their own record
alter table potters enable row level security;
create policy "Potters can read own" on potters for select using (auth.uid() = auth_user_id);
create policy "Potters can update own" on potters for update using (auth.uid() = auth_user_id);
create policy "Potters can insert own" on potters for insert with check (auth.uid() = auth_user_id);

-- RLS: public can read all potters and products (for the site)
create policy "Public can read potters" on potters for select using (true);
create policy "Public can read products" on products for select using (true);

-- RLS: potters can manage their own products
create policy "Potters can insert own products" on products for insert
  with check (potter_id in (select id from potters where auth_user_id = auth.uid()));
create policy "Potters can update own products" on products for update
  using (potter_id in (select id from potters where auth_user_id = auth.uid()));
create policy "Potters can delete own products" on products for delete
  using (potter_id in (select id from potters where auth_user_id = auth.uid()));

alter table products enable row level security;

-- Storage: In Supabase Dashboard > Storage, create bucket "product-images" (Public: Yes).
-- Then add policy: allow authenticated users to insert; allow public to select.
