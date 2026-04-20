-- URL linking to the course page on the potter's own website
alter table courses add column if not exists url text;
