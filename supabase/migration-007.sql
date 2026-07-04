-- Cheeky Chekis — migration 007
-- Lets you mark a sold cheki as sold "to a friend", moving it into their
-- collection. A normal client-side UPDATE can't change owner_id (RLS re-checks
-- the new row against the same USING clause), so this uses a SECURITY DEFINER
-- function that verifies you own the cheki and are friends with the target
-- before transferring it.
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

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
    set owner_id = p_new_owner, sold = true, for_sale = false, price = null
    where id = p_cheki_id;

  delete from binder_chekis
    using binders
    where binder_chekis.cheki_id = p_cheki_id
      and binders.id = binder_chekis.binder_id
      and binders.owner_id = v_owner;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function transfer_cheki_to_friend(uuid, uuid) to authenticated;
