-- Add active column to potters (run in Supabase SQL Editor if you already have the base schema)
-- Inactive potters and their products are hidden from the catalog

alter table potters add column if not exists active boolean not null default true;
