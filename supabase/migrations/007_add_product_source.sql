-- Add source column to products to track origin (run in Supabase SQL Editor)
-- 'manual' = potter-added, 'onboarding-scout' = agent-created draft
alter table products add column if not exists source text not null default 'manual';
create index if not exists products_source on products(source);
