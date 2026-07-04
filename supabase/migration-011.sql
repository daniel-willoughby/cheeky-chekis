-- "Second Life": tag a cheki that was received via a friend's sold-to-friend
-- transfer, and remember who gave it away.
alter table chekis
  add column if not exists received_from uuid references profiles(id) on delete set null;

create or replace function transfer_cheki_to_friend(p_cheki_id uuid, p_new_owner uuid)
returns void as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from chekis where id = p_cheki_id;
  if v_owner is null then
    raise exception 'cheki not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'not your cheki';
  end if;
  if not are_friends(auth.uid(), p_new_owner) then
    raise exception 'not friends with that user';
  end if;

  update chekis
    set owner_id = p_new_owner, sold = true, for_sale = false, price = null, received_from = v_owner
    where id = p_cheki_id;

  delete from binder_chekis
    using binders
    where binder_chekis.cheki_id = p_cheki_id
      and binders.id = binder_chekis.binder_id
      and binders.owner_id = v_owner;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function transfer_cheki_to_friend(uuid, uuid) to authenticated;
