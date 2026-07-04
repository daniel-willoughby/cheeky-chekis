-- Sold-to-friend transfers now require the recipient's consent instead of
-- transferring instantly. Adds a pending-transfer column and replaces the
-- old instant transfer_cheki_to_friend with accept/decline functions.
alter table chekis
  add column if not exists transfer_pending_to uuid references profiles(id) on delete set null;

drop function if exists transfer_cheki_to_friend(uuid, uuid);

create or replace function accept_cheki_transfer(p_cheki_id uuid)
returns void as $$
declare
  v_owner uuid;
  v_pending uuid;
begin
  select owner_id, transfer_pending_to into v_owner, v_pending from chekis where id = p_cheki_id;
  if v_owner is null then
    raise exception 'cheki not found';
  end if;
  if v_pending is null or v_pending <> auth.uid() then
    raise exception 'no pending transfer for you';
  end if;

  update chekis
    set owner_id = auth.uid(), sold = true, for_sale = false, price = null,
        received_from = v_owner, transfer_pending_to = null
    where id = p_cheki_id;

  update profiles set points = points + 10 where id = v_owner;

  delete from binder_chekis
    using binders
    where binder_chekis.cheki_id = p_cheki_id
      and binders.id = binder_chekis.binder_id
      and binders.owner_id = v_owner;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function decline_cheki_transfer(p_cheki_id uuid)
returns void as $$
declare
  v_pending uuid;
begin
  select transfer_pending_to into v_pending from chekis where id = p_cheki_id;
  if v_pending is null or v_pending <> auth.uid() then
    raise exception 'no pending transfer for you';
  end if;
  update chekis set transfer_pending_to = null where id = p_cheki_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function accept_cheki_transfer(uuid) to authenticated;
grant execute on function decline_cheki_transfer(uuid) to authenticated;
