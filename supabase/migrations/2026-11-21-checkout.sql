-- Online checkout for pieces (Stripe Checkout, direct charges on the potter's connected account).

-- Buyers check out as guests: their details come back from Stripe and are stored on the order.
alter table orders alter column customer_id drop not null;
alter table orders add column if not exists buyer_email text;
alter table orders add column if not exists buyer_name text;
alter table orders add column if not exists buyer_phone text;
alter table orders add column if not exists expires_at timestamptz;
alter table orders add column if not exists collected_at timestamptz;
create index if not exists orders_piece_pending_idx on orders (piece_id) where status = 'pending';

-- Hold a piece while someone pays. Succeeds if the piece is live, or if it is reserved by a
-- checkout that has already expired (a missed "expired" webhook can't leave a pot stuck).
create or replace function reserve_piece(p_piece_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_status piece_status;
begin
  select status into v_status from pieces where id = p_piece_id for update;
  if v_status is null then return false; end if;

  if v_status = 'reserved' then
    if exists (select 1 from orders where piece_id = p_piece_id and status = 'pending' and expires_at > now()) then
      return false;
    end if;
    update orders set status = 'cancelled' where piece_id = p_piece_id and status = 'pending';
  elsif v_status <> 'live' then
    return false;
  end if;

  update pieces set status = 'reserved' where id = p_piece_id;
  return true;
end $$;

-- Give a piece back when its checkout expires or is abandoned.
create or replace function release_order(p_checkout_session_id text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where stripe_checkout_session = p_checkout_session_id for update;
  if not found or v_order.status <> 'pending' then return; end if;
  update orders set status = 'cancelled' where id = v_order.id;
  update pieces set status = 'live' where id = v_order.piece_id and status = 'reserved';
end $$;

-- Only the server (service role) calls these.
revoke execute on function reserve_piece(uuid) from public, anon, authenticated;
revoke execute on function release_order(text) from public, anon, authenticated;
revoke execute on function mark_order_paid(text, text) from public, anon, authenticated;

-- Held and sold pieces stay viewable (marked "being bought" / "sold"); the shop view still lists only live ones.
drop policy if exists pieces_public_read on pieces;
create policy pieces_public_read on pieces for select using (status in ('live', 'reserved', 'sold'));
drop policy if exists pi_public_read on piece_images;
create policy pi_public_read on piece_images for select using (
  piece_id in (select id from pieces where status in ('live', 'reserved', 'sold')));
