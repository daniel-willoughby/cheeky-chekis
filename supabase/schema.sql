-- Cheeky Chekis — Supabase schema
-- Run this once in the Supabase Dashboard: SQL Editor > New query > paste > Run.

-- ============ profiles ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null,
  emoji text not null default '🎮',
  color text not null default '#ff8fc7',
  bio text not null default '',
  favourite_maid_ids uuid[] not null default '{}',
  points int not null default 0,
  owned_designs text[] not null default '{classic}',
  last_login_at date,
  last_seen_friends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on profiles for select to authenticated using (true);
create policy "users can update their own profile"
  on profiles for update to authenticated using (id = auth.uid());
create policy "users can insert their own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

-- auto-create a profile row when someone signs up.
-- Anything that raises here rolls back the auth.users insert ("Database error
-- saving new user"), so the profile row is the only critical step — starter
-- binders are created in a guarded block that can never block signup.
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text := split_part(coalesce(new.email, 'cheeky'), '@', 1);
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
  -- starter binders: one for regular chekis, one reserved for settlements
  -- (the app hides 'Cheki Settlements' from binder pickers and fills it
  -- automatically when settlement photos are attached to a cheki)
  begin
    insert into binders (owner_id, name, design) values
      (new.id, 'Cheki binder', 'classic'),
      (new.id, 'Cheki Settlements', 'classic');
  exception when others then
    raise warning 'handle_new_user: starter binders skipped for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============ cafes & maids (shared reference data) ============
create table if not exists cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  manager text not null,
  color text not null,
  emoji text not null,
  vibe text not null,
  cheki_price int not null default 0,
  rules text[] not null default '{}'
);

create table if not exists maids (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes(id) on delete cascade,
  name text not null,
  color text not null,
  emoji text not null,
  hair_color text not null,
  specialty text not null,
  bio text not null,
  graduated boolean not null default false
);

alter table cafes enable row level security;
alter table maids enable row level security;

create policy "cafes are readable by any signed-in user"
  on cafes for select to authenticated using (true);
create policy "any signed-in user can edit cafe info"
  on cafes for update to authenticated using (true);
create policy "any signed-in user can delete a cafe"
  on cafes for delete to authenticated using (true);

create policy "maids are readable by any signed-in user"
  on maids for select to authenticated using (true);
create policy "any signed-in user can delete a maid"
  on maids for delete to authenticated using (true);

-- ============ friendships ============
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

alter table friendships enable row level security;

create policy "see friendships you're part of"
  on friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "send friend requests as yourself"
  on friendships for insert to authenticated
  with check (requester_id = auth.uid());
create policy "respond to or cancel your own friendships"
  on friendships for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "delete friendships you're part of"
  on friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- helper: are two users accepted friends?
create or replace function are_friends(a uuid, b uuid)
returns boolean as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$ language sql stable security definer set search_path = public;

-- ============ chekis ============
create table if not exists chekis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  image_path text,
  maid_ids uuid[] not null default '{}',
  cafe_id uuid references cafes(id) on delete set null,
  date date,
  type text not null,
  status text not null default 'on-hand',
  for_sale boolean not null default false,
  sold boolean not null default false,
  price int,
  notes text,
  -- when set, this row is a "settlement" photo attached to the referenced
  -- parent cheki; it inherits the parent's classifications and is hidden
  -- from the normal collection views.
  settlement_of uuid references chekis(id) on delete cascade,
  -- set when this cheki was received via a friend's sold-to-friend transfer;
  -- points at the friend who gave it away, drives the "Second Life" tag.
  received_from uuid references profiles(id) on delete set null,
  -- set while a sold-to-friend transfer is awaiting the recipient's accept.
  transfer_pending_to uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table chekis enable row level security;
create index if not exists chekis_settlement_of_idx on chekis(settlement_of);

create policy "see your own chekis, friends' chekis, or anything for sale"
  on chekis for select to authenticated
  using (
    owner_id = auth.uid()
    or for_sale = true
    or are_friends(auth.uid(), owner_id)
  );
create policy "insert your own chekis"
  on chekis for insert to authenticated with check (owner_id = auth.uid());
create policy "update your own chekis"
  on chekis for update to authenticated using (owner_id = auth.uid());
create policy "delete your own chekis"
  on chekis for delete to authenticated using (owner_id = auth.uid());

-- ============ binders ============
create table if not exists binders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  design text not null default 'classic',
  created_at timestamptz not null default now()
);

create table if not exists binder_chekis (
  binder_id uuid references binders(id) on delete cascade,
  cheki_id uuid references chekis(id) on delete cascade,
  primary key (binder_id, cheki_id)
);

alter table binders enable row level security;
alter table binder_chekis enable row level security;

create policy "see your own binders or friends' binders"
  on binders for select to authenticated
  using (owner_id = auth.uid() or are_friends(auth.uid(), owner_id));
create policy "insert your own binders"
  on binders for insert to authenticated with check (owner_id = auth.uid());
create policy "update your own binders"
  on binders for update to authenticated using (owner_id = auth.uid());
create policy "delete your own binders"
  on binders for delete to authenticated using (owner_id = auth.uid());

create policy "see binder_chekis for binders you can see"
  on binder_chekis for select to authenticated
  using (
    exists (
      select 1 from binders b where b.id = binder_id
      and (b.owner_id = auth.uid() or are_friends(auth.uid(), b.owner_id))
    )
  );
create policy "manage binder_chekis for your own binders"
  on binder_chekis for all to authenticated
  using (exists (select 1 from binders b where b.id = binder_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from binders b where b.id = binder_id and b.owner_id = auth.uid()));

-- Sold-to-friend transfers require the recipient's consent: the seller sets
-- transfer_pending_to (a plain update on their own row, no special
-- privileges needed); the recipient then accepts or declines. Accepting
-- changes owner_id, which RLS won't allow via a plain update (it re-checks
-- the new row against the same USING clause), so that step is a SECURITY
-- DEFINER function.
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

  -- settlements ride along with their parent cheki
  update chekis set owner_id = auth.uid() where settlement_of = p_cheki_id;

  -- award the seller their sold-points now that the transfer is confirmed
  -- (keep in sync with POINTS.sold in src/data/designs.ts)
  update profiles set points = points + 10 where id = v_owner;

  -- drop the old owner's binder links for the cheki and its settlements
  delete from binder_chekis
    using binders
    where (binder_chekis.cheki_id = p_cheki_id
           or binder_chekis.cheki_id in (select id from chekis where settlement_of = p_cheki_id))
      and binders.id = binder_chekis.binder_id
      and binders.owner_id = v_owner;

  -- file the settlements into the recipient's settlements binder
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

-- ============ cheki likes ============
create table if not exists cheki_likes (
  cheki_id uuid not null references chekis(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cheki_id, user_id)
);

alter table cheki_likes enable row level security;

create policy "see likes on chekis you can see"
  on cheki_likes for select to authenticated
  using (
    exists (
      select 1 from chekis c
      where c.id = cheki_id
        and (c.owner_id = auth.uid() or c.for_sale = true or are_friends(auth.uid(), c.owner_id))
    )
  );

create policy "like chekis you can see"
  on cheki_likes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from chekis c
      where c.id = cheki_id
        and (c.owner_id = auth.uid() or c.for_sale = true or are_friends(auth.uid(), c.owner_id))
    )
  );

create policy "remove your own like"
  on cheki_likes for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on cheki_likes to authenticated;

-- ============ storage: cheki photos ============
insert into storage.buckets (id, name, public)
values ('chekis', 'chekis', true)
on conflict (id) do nothing;

create policy "cheki photos are publicly readable"
  on storage.objects for select using (bucket_id = 'chekis');
create policy "users upload cheki photos into their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chekis' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete their own cheki photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chekis' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ table privileges ============
-- RLS restricts which rows each user can touch; these grants let the
-- authenticated role issue the statements in the first place.
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
