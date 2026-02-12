-- Settings table for admin configuration (key-value)
create table if not exists settings (
  key text primary key,
  value text not null
);

-- Insert default commission (10%) if not exists
insert into settings (key, value) values ('default_commission_percent', '10')
on conflict (key) do nothing;

-- Per-potter commission override (nullable; if set, overrides default)
alter table potters add column if not exists commission_override_percent numeric(5,2);

-- Settings: RLS enabled, no policies = only service role can access
alter table settings enable row level security;
