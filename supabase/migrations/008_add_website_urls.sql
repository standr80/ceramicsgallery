-- Add targeted URL fields to potters for the multi-URL Onboarding Scout
alter table potters add column if not exists website_about text;
alter table potters add column if not exists website_shop text;
alter table potters add column if not exists website_courses text;
