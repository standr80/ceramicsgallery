-- Add force_password_reset to potters (run in Supabase SQL Editor)
-- When true, potter must change password on next login
alter table potters add column if not exists force_password_reset boolean not null default false;
