-- Add active column to products (run in Supabase SQL Editor if you already have the base schema)
alter table products add column if not exists active boolean not null default true;
