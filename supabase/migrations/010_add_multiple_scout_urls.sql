-- Add extra shop and courses URL slots for potters with multiple pages
alter table potters add column if not exists website_shop_2 text;
alter table potters add column if not exists website_shop_3 text;
alter table potters add column if not exists website_courses_2 text;
alter table potters add column if not exists website_courses_3 text;
