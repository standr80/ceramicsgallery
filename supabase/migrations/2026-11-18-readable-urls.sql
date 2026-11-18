-- Readable URLs: /<potter>/<piece-slug> and /courses/<course-slug>.
-- Slugs are made from the title when a row is created and then stay put, so links never break.
-- Piece slugs are unique per potter; course slugs are unique site-wide.

create or replace function make_slug(t text, fallback text) returns text
language sql immutable as $$
  select coalesce(
    nullif(left(trim(both '-' from regexp_replace(regexp_replace(lower(coalesce(t, '')), '[''’]', '', 'g'), '[^a-z0-9]+', '-', 'g')), 70), ''),
    fallback)
$$;

alter table pieces  add column if not exists slug text;
alter table courses add column if not exists slug text;

create or replace function set_piece_slug() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  if new.slug is not null and new.slug <> '' and (tg_op = 'UPDATE' and new.slug = old.slug) then
    return new;
  end if;
  base := make_slug(coalesce(nullif(new.slug, ''), new.title), 'piece');
  candidate := base;
  while exists (select 1 from pieces where potter_id = new.potter_id and slug = candidate and id <> new.id) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  new.slug := candidate;
  return new;
end $$;

create or replace function set_course_slug() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  if new.slug is not null and new.slug <> '' and (tg_op = 'UPDATE' and new.slug = old.slug) then
    return new;
  end if;
  base := make_slug(coalesce(nullif(new.slug, ''), new.title), 'course');
  candidate := base;
  while exists (select 1 from courses where slug = candidate and id <> new.id) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  new.slug := candidate;
  return new;
end $$;

drop trigger if exists pieces_slug on pieces;
create trigger pieces_slug before insert or update of slug on pieces
  for each row execute function set_piece_slug();

drop trigger if exists courses_slug on courses;
create trigger courses_slug before insert or update of slug on courses
  for each row execute function set_course_slug();

-- Backfill, oldest first so the original keeps the plain slug.
do $$
declare r record;
begin
  for r in select id from pieces where slug is null order by created_at loop
    update pieces set slug = '' where id = r.id;
  end loop;
  for r in select id from courses where slug is null order by created_at loop
    update courses set slug = '' where id = r.id;
  end loop;
end $$;

alter table pieces  alter column slug set not null;
alter table courses alter column slug set not null;
create unique index if not exists pieces_potter_slug_key on pieces (potter_id, slug);
create unique index if not exists courses_slug_key on courses (slug);

-- Expose the slug to the shop and potter listings (new column goes last so the view can be replaced).
create or replace view gallery_pieces as
select
  p.id,
  p.title,
  p.description,
  p.price_pence,
  p.height_cm,
  p.width_cm,
  p.clay_body,
  p.glaze_notes,
  p.firing,
  p.food_safe,
  p.collection_available,
  po.slug         as potter_slug,
  po.display_name as potter_name,
  po.location_label,
  c.label         as category,
  (select pi.original_path
   from piece_images pi
   where pi.piece_id = p.id
   order by pi.position limit 1) as cover_path,
  p.published_at,
  p.slug
from pieces p
join potters po on po.id = p.potter_id
left join categories c on c.id = p.category_id
where p.status = 'live'
  and po.is_published = true;
