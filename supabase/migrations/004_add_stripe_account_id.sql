-- Add Stripe Connect account ID to potters (run in Supabase SQL Editor)
alter table potters add column if not exists stripe_account_id text;
