-- ============================================================================
-- Cheeky Chekis — single idempotent setup script.
--
-- Run this ONCE in the Supabase Dashboard (SQL Editor > New query > paste > Run).
-- It is safe to re-run any time: every statement is guarded (create ... if not
-- exists / create or replace / drop policy if exists), so it brings a fresh OR
-- a partially-migrated database up to the current schema without errors.
--
-- This supersedes schema.sql and all supabase/migration-0NN.sql files — you no
-- longer need to run those. When the schema changes in future, edit THIS file
-- (keeping every statement idempotent) and re-run it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables (create if missing)
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null
);

create table if not exists cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists maids (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes(id) on delete cascade,
  name text not null
);

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create table if not exists chekis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);

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

create table if not exists cheki_likes (
  cheki_id uuid not null references chekis(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cheki_id, user_id)
);

-- settlements ↔ chekis (a settlement photo can belong to several chekis)
create table if not exists settlement_chekis (
  settlement_id uuid not null references chekis(id) on delete cascade,
  cheki_id uuid not null references chekis(id) on delete cascade,
  primary key (settlement_id, cheki_id)
);

-- dev-facing activity log: what users do in the app (admins only can read it)
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- non-admins can request a new cafe/maid; admins approve (which creates it)
create table if not exists content_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Columns (add if missing — reconciles any drift on existing tables)
-- ---------------------------------------------------------------------------

alter table profiles add column if not exists emoji text not null default '🎮';
alter table profiles add column if not exists color text not null default '#ff8fc7';
alter table profiles add column if not exists bio text not null default '';
alter table profiles add column if not exists favourite_maid_ids uuid[] not null default '{}';
alter table profiles add column if not exists points int not null default 0;
alter table profiles add column if not exists owned_designs text[] not null default '{classic}';
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists avatar_path text;
alter table profiles add column if not exists last_login_at date;
alter table profiles add column if not exists last_seen_friends_at timestamptz;
alter table profiles add column if not exists created_at timestamptz not null default now();

alter table cafes add column if not exists district text not null default '';
alter table cafes add column if not exists manager text not null default '';
alter table cafes add column if not exists color text not null default '#ff8fc7';
alter table cafes add column if not exists emoji text not null default '🎀';
alter table cafes add column if not exists vibe text not null default '';
alter table cafes add column if not exists cheki_price int not null default 0;
alter table cafes add column if not exists type_prices jsonb not null default '{}'::jsonb;
alter table cafes add column if not exists rules text[] not null default '{}';
alter table cafes add column if not exists image_path text;

alter table maids add column if not exists color text not null default '#ff8fc7';
alter table maids add column if not exists emoji text not null default '🎀';
alter table maids add column if not exists hair_color text not null default '';
alter table maids add column if not exists specialty text not null default '';
alter table maids add column if not exists bio text not null default '';
alter table maids add column if not exists graduated boolean not null default false;
alter table maids add column if not exists image_path text;

alter table chekis add column if not exists image_path text;
alter table chekis add column if not exists maid_ids uuid[] not null default '{}';
alter table chekis add column if not exists cafe_id uuid references cafes(id) on delete set null;
alter table chekis add column if not exists cafe_ids uuid[] not null default '{}';
-- how many chekis a grid represents (grids count as N toward the total)
alter table chekis add column if not exists grid_count int;
alter table chekis add column if not exists date date;
alter table chekis add column if not exists status text not null default 'on-hand';
alter table chekis add column if not exists for_sale boolean not null default false;
alter table chekis add column if not exists sold boolean not null default false;
alter table chekis add column if not exists price int;
alter table chekis add column if not exists notes text;
alter table chekis add column if not exists settlement_of uuid references chekis(id) on delete cascade;
alter table chekis add column if not exists is_settlement boolean not null default false;
alter table chekis add column if not exists received_from uuid references profiles(id) on delete set null;
alter table chekis add column if not exists transfer_pending_to uuid references profiles(id) on delete set null;

create index if not exists chekis_settlement_of_idx on chekis(settlement_of);

-- ---------------------------------------------------------------------------
-- 3. Row level security (enabling is idempotent)
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table cafes enable row level security;
alter table maids enable row level security;
alter table friendships enable row level security;
alter table chekis enable row level security;
alter table binders enable row level security;
alter table binder_chekis enable row level security;
alter table cheki_likes enable row level security;
alter table settlement_chekis enable row level security;
alter table content_requests enable row level security;
alter table activity_log enable row level security;

create index if not exists activity_log_created_at_idx on activity_log(created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Functions
-- ---------------------------------------------------------------------------

create or replace function is_admin(uid uuid)
returns boolean as $$
  select coalesce((select is_admin from profiles where id = uid), false);
$$ language sql security definer stable set search_path = public;

create or replace function are_friends(a uuid, b uuid)
returns boolean as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$ language sql stable security definer set search_path = public;

-- auto-create a profile row (+ starter binders) on signup. Wrapped so any
-- failure logs a warning instead of aborting the auth.users insert; the app's
-- ensureProfile() finishes provisioning on first load.
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text := split_part(coalesce(new.email, 'cheeky'), '@', 1);
  candidate text := base_username;
  n int := 0;
begin
  while exists (select 1 from profiles where username = candidate) loop
    n := n + 1;
    candidate := base_username || n::text;
  end loop;
  insert into profiles (id, username, name) values (new.id, candidate, base_username);
  insert into binders (owner_id, name, design) values
    (new.id, 'Cheki binder', 'classic'),
    (new.id, 'Cheki Settlements', 'classic');
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- accept a sold-to-friend transfer (changes owner_id, which RLS won't allow
-- via a plain update, so it runs as SECURITY DEFINER).
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

  -- award the seller their sold-points (keep in sync with POINTS.sold)
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

-- ---------------------------------------------------------------------------
-- 5. Policies (drop + recreate so re-runs never error)
-- ---------------------------------------------------------------------------

-- profiles
drop policy if exists "profiles are readable by any signed-in user" on profiles;
create policy "profiles are readable by any signed-in user"
  on profiles for select to authenticated using (true);
drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update to authenticated using (id = auth.uid());
drop policy if exists "users can insert their own profile" on profiles;
create policy "users can insert their own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

-- cafes (admin-only writes)
drop policy if exists "cafes are readable by any signed-in user" on cafes;
create policy "cafes are readable by any signed-in user"
  on cafes for select to authenticated using (true);
drop policy if exists "admins can add a cafe" on cafes;
create policy "admins can add a cafe"
  on cafes for insert to authenticated with check (is_admin(auth.uid()));
drop policy if exists "admins can edit cafe info" on cafes;
create policy "admins can edit cafe info"
  on cafes for update to authenticated using (is_admin(auth.uid()));
drop policy if exists "admins can delete a cafe" on cafes;
create policy "admins can delete a cafe"
  on cafes for delete to authenticated using (is_admin(auth.uid()));

-- maids (admin-only writes)
drop policy if exists "maids are readable by any signed-in user" on maids;
create policy "maids are readable by any signed-in user"
  on maids for select to authenticated using (true);
drop policy if exists "admins can add a maid" on maids;
create policy "admins can add a maid"
  on maids for insert to authenticated with check (is_admin(auth.uid()));
drop policy if exists "admins can edit a maid" on maids;
create policy "admins can edit a maid"
  on maids for update to authenticated using (is_admin(auth.uid()));
drop policy if exists "admins can delete a maid" on maids;
create policy "admins can delete a maid"
  on maids for delete to authenticated using (is_admin(auth.uid()));

-- friendships
drop policy if exists "see friendships you're part of" on friendships;
create policy "see friendships you're part of"
  on friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "send friend requests as yourself" on friendships;
create policy "send friend requests as yourself"
  on friendships for insert to authenticated with check (requester_id = auth.uid());
drop policy if exists "respond to or cancel your own friendships" on friendships;
create policy "respond to or cancel your own friendships"
  on friendships for update to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "delete friendships you're part of" on friendships;
create policy "delete friendships you're part of"
  on friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- chekis
drop policy if exists "see your own chekis, friends' chekis, or anything for sale" on chekis;
create policy "see your own chekis, friends' chekis, or anything for sale"
  on chekis for select to authenticated
  using (owner_id = auth.uid() or for_sale = true or are_friends(auth.uid(), owner_id));
drop policy if exists "insert your own chekis" on chekis;
create policy "insert your own chekis"
  on chekis for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "update your own chekis" on chekis;
create policy "update your own chekis"
  on chekis for update to authenticated using (owner_id = auth.uid());
drop policy if exists "delete your own chekis" on chekis;
create policy "delete your own chekis"
  on chekis for delete to authenticated using (owner_id = auth.uid());

-- binders
drop policy if exists "see your own binders or friends' binders" on binders;
create policy "see your own binders or friends' binders"
  on binders for select to authenticated
  using (owner_id = auth.uid() or are_friends(auth.uid(), owner_id));
drop policy if exists "insert your own binders" on binders;
create policy "insert your own binders"
  on binders for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "update your own binders" on binders;
create policy "update your own binders"
  on binders for update to authenticated using (owner_id = auth.uid());
drop policy if exists "delete your own binders" on binders;
create policy "delete your own binders"
  on binders for delete to authenticated using (owner_id = auth.uid());

-- binder_chekis
drop policy if exists "see binder_chekis for binders you can see" on binder_chekis;
create policy "see binder_chekis for binders you can see"
  on binder_chekis for select to authenticated
  using (
    exists (
      select 1 from binders b where b.id = binder_id
      and (b.owner_id = auth.uid() or are_friends(auth.uid(), b.owner_id))
    )
  );
drop policy if exists "manage binder_chekis for your own binders" on binder_chekis;
create policy "manage binder_chekis for your own binders"
  on binder_chekis for all to authenticated
  using (exists (select 1 from binders b where b.id = binder_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from binders b where b.id = binder_id and b.owner_id = auth.uid()));

-- cheki_likes
drop policy if exists "see likes on chekis you can see" on cheki_likes;
create policy "see likes on chekis you can see"
  on cheki_likes for select to authenticated
  using (
    exists (
      select 1 from chekis c where c.id = cheki_id
        and (c.owner_id = auth.uid() or c.for_sale = true or are_friends(auth.uid(), c.owner_id))
    )
  );
drop policy if exists "like chekis you can see" on cheki_likes;
create policy "like chekis you can see"
  on cheki_likes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from chekis c where c.id = cheki_id
        and (c.owner_id = auth.uid() or c.for_sale = true or are_friends(auth.uid(), c.owner_id))
    )
  );
drop policy if exists "remove your own like" on cheki_likes;
create policy "remove your own like"
  on cheki_likes for delete to authenticated using (user_id = auth.uid());

-- settlement_chekis (owner manages links; owner + friends can view)
drop policy if exists "see settlement links you can see" on settlement_chekis;
create policy "see settlement links you can see"
  on settlement_chekis for select to authenticated
  using (
    exists (
      select 1 from chekis c where c.id = settlement_id
        and (c.owner_id = auth.uid() or are_friends(auth.uid(), c.owner_id))
    )
  );
drop policy if exists "add your own settlement links" on settlement_chekis;
create policy "add your own settlement links"
  on settlement_chekis for insert to authenticated
  with check (
    exists (select 1 from chekis c where c.id = settlement_id and c.owner_id = auth.uid())
    and exists (select 1 from chekis c2 where c2.id = cheki_id and c2.owner_id = auth.uid())
  );
drop policy if exists "remove your own settlement links" on settlement_chekis;
create policy "remove your own settlement links"
  on settlement_chekis for delete to authenticated
  using (exists (select 1 from chekis c where c.id = settlement_id and c.owner_id = auth.uid()));

-- content_requests (anyone files; requester or any admin sees/deletes)
drop policy if exists "see your requests or all if admin" on content_requests;
create policy "see your requests or all if admin"
  on content_requests for select to authenticated
  using (requester_id = auth.uid() or is_admin(auth.uid()));
drop policy if exists "file your own request" on content_requests;
create policy "file your own request"
  on content_requests for insert to authenticated
  with check (requester_id = auth.uid());
drop policy if exists "delete your request or any if admin" on content_requests;
create policy "delete your request or any if admin"
  on content_requests for delete to authenticated
  using (requester_id = auth.uid() or is_admin(auth.uid()));

-- activity_log: anyone records their own actions; only admins can read it back
drop policy if exists "log your own actions" on activity_log;
create policy "log your own actions"
  on activity_log for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "admins read the activity log" on activity_log;
create policy "admins read the activity log"
  on activity_log for select to authenticated using (is_admin(auth.uid()));
drop policy if exists "admins clear the activity log" on activity_log;
create policy "admins clear the activity log"
  on activity_log for delete to authenticated using (is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. Storage buckets + policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('chekis', 'chekis', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('images', 'images', true)
  on conflict (id) do nothing;

drop policy if exists "cheki photos are publicly readable" on storage.objects;
create policy "cheki photos are publicly readable"
  on storage.objects for select using (bucket_id = 'chekis');
drop policy if exists "users upload cheki photos into their own folder" on storage.objects;
create policy "users upload cheki photos into their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chekis' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "users delete their own cheki photos" on storage.objects;
create policy "users delete their own cheki photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chekis' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "images are publicly readable" on storage.objects;
create policy "images are publicly readable"
  on storage.objects for select using (bucket_id = 'images');
drop policy if exists "signed-in users can upload images" on storage.objects;
create policy "signed-in users can upload images"
  on storage.objects for insert to authenticated with check (bucket_id = 'images');
drop policy if exists "signed-in users can replace images" on storage.objects;
create policy "signed-in users can replace images"
  on storage.objects for update to authenticated using (bucket_id = 'images');

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;

-- ---------------------------------------------------------------------------
-- 8. Data reconciliation (idempotent)
-- ---------------------------------------------------------------------------

-- admins (case-insensitive match, so 'Holakittybel' etc. still count)
update profiles set is_admin = true
  where lower(username) in ('holakittybel', 'winter', 'sarah', 'd.t.willoughby');

-- existing single-cafe chekis get their cafe in the cafe_ids array
update chekis set cafe_ids = array[cafe_id]
  where cafe_id is not null and cafe_ids = '{}';

-- old attached settlements are flagged, and their parent link is mirrored into
-- the many-to-many table
update chekis set is_settlement = true where settlement_of is not null and is_settlement = false;
insert into settlement_chekis (settlement_id, cheki_id)
  select id, settlement_of from chekis where settlement_of is not null
  on conflict do nothing;

-- everyone has a settlements binder; accounts with no other binder get a starter
insert into binders (owner_id, name, design)
  select p.id, 'Cheki Settlements', 'classic' from profiles p
  where not exists (select 1 from binders b where b.owner_id = p.id and b.name = 'Cheki Settlements');
insert into binders (owner_id, name, design)
  select p.id, 'Cheki binder', 'classic' from profiles p
  where not exists (select 1 from binders b where b.owner_id = p.id and b.name <> 'Cheki Settlements');
