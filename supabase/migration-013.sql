-- Starter binders + settlements-binder rules.
-- 1) New accounts get two binders: 'Cheki binder' and 'Cheki Settlements'.
-- 2) Backfill both for existing accounts.
-- 3) accept_cheki_transfer now moves a cheki's settlements along with it,
--    filing them into the recipient's settlements binder.

-- ---- 1) signup trigger ----
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text := split_part(new.email, '@', 1);
  candidate text := base_username;
  n int := 0;
  palette text[] := array['#ff8fc7', '#9b6cff', '#5b8def', '#5fd0a0', '#ffd35b'];
begin
  while exists (select 1 from profiles where username = candidate) loop
    n := n + 1;
    candidate := base_username || n::text;
  end loop;
  insert into profiles (id, username, name, color)
  values (new.id, candidate, base_username, palette[1 + (abs(hashtext(new.id::text)) % 5)]);
  insert into binders (owner_id, name, design) values
    (new.id, 'Cheki binder', 'classic'),
    (new.id, 'Cheki Settlements', 'classic');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ---- 2) backfill existing accounts ----
-- everyone gets a settlements binder if they don't have one
insert into binders (owner_id, name, design)
select p.id, 'Cheki Settlements', 'classic'
from profiles p
where not exists (select 1 from binders b where b.owner_id = p.id and b.name = 'Cheki Settlements');

-- only accounts with no other binders get the starter 'Cheki binder'
insert into binders (owner_id, name, design)
select p.id, 'Cheki binder', 'classic'
from profiles p
where not exists (select 1 from binders b where b.owner_id = p.id and b.name <> 'Cheki Settlements');

-- ---- 3) transfers carry settlements along ----
create or replace function accept_cheki_transfer(p_cheki_id uuid)
returns void as $$
declare
  v_owner uuid;
  v_pending uuid;
  v_settlements_binder uuid;
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

  update chekis set owner_id = auth.uid() where settlement_of = p_cheki_id;

  update profiles set points = points + 10 where id = v_owner;

  delete from binder_chekis
    using binders
    where (binder_chekis.cheki_id = p_cheki_id
           or binder_chekis.cheki_id in (select id from chekis where settlement_of = p_cheki_id))
      and binders.id = binder_chekis.binder_id
      and binders.owner_id = v_owner;

  select id into v_settlements_binder
    from binders where owner_id = auth.uid() and name = 'Cheki Settlements' limit 1;
  if v_settlements_binder is null then
    insert into binders (owner_id, name, design)
      values (auth.uid(), 'Cheki Settlements', 'classic')
      returning id into v_settlements_binder;
  end if;
  insert into binder_chekis (binder_id, cheki_id)
    select v_settlements_binder, id from chekis where settlement_of = p_cheki_id
    on conflict do nothing;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function accept_cheki_transfer(uuid) to authenticated;
