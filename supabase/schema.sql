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
  owned_designs text[] not null default '{classic,sakura,midnight}',
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

-- auto-create a profile row when someone signs up
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
  bio text not null
);

alter table cafes enable row level security;
alter table maids enable row level security;

create policy "cafes are readable by any signed-in user"
  on cafes for select to authenticated using (true);
create policy "any signed-in user can edit cafe info"
  on cafes for update to authenticated using (true);

create policy "maids are readable by any signed-in user"
  on maids for select to authenticated using (true);

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
  cafe_id uuid references cafes(id),
  date date,
  type text not null,
  status text not null default 'on-hand',
  for_sale boolean not null default false,
  sold boolean not null default false,
  price int,
  notes text,
  created_at timestamptz not null default now()
);

alter table chekis enable row level security;

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

-- ============ seed reference data (cafes + maids) ============
insert into cafes (id, name, district, manager, color, emoji, vibe, cheki_price, rules) values
  ('11111111-1111-1111-1111-111111111101', 'Lumiere Maid Cafe', 'Hongdae, Seoul', 'Manager Yuna', '#ff8fc7', '🎀', 'Bright and bubbly, big on 4-cut photo sets.', 8000, array['One cheki per song request.', 'Homework chekis on Sundays only.', 'Group 4-cut needs 3+ guests.']),
  ('11111111-1111-1111-1111-111111111102', 'Neko Neko Cha', 'Gangnam, Seoul', 'Manager Riri', '#9b6cff', '🐾', 'Cozy cat theme, known for special pin chekis.', 9000, array['Pins limited to 5 per maid per day.', 'No flash photography.', 'Twin chekis need both maids on shift.']),
  ('11111111-1111-1111-1111-111111111103', 'Starlight Terrace', 'Busan', 'Manager Bora', '#5b8def', '⭐', 'Seaside cafe, live singing every weekend.', 7500, array['Weekend live sets at 7pm.', 'Cheki trades allowed at the counter.', 'Homework chekis mailed within a week.'])
on conflict (id) do nothing;

insert into maids (id, cafe_id, name, color, emoji, hair_color, specialty, bio) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Yuna', '#ff8fc7', '👑', 'pink', 'Song requests', 'Lumiere ace. Never misses a high note.'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Hana', '#9b6cff', '🌸', 'lilac', '4-cut poses', 'Queen of the 4-cut. Endless pose ideas.'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Sori', '#5b8def', '🫧', 'blue', 'Latte art', 'Draws your face in the foam.'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Riri', '#9b6cff', '🐱', 'purple', 'Special pins', 'Neko Neko legend. Pins sell out fast.'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'Mochi', '#ff8fc7', '🍡', 'cream', 'Homework chekis', 'Writes the sweetest homework notes.'),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111103', 'Bora', '#5b8def', '🌊', 'aqua', 'Live singing', 'Starlight headliner. Seaside voice.'),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111103', 'Nari', '#9b6cff', '🌟', 'violet', 'Cheki trades', 'Knows every collector by name.')
on conflict (id) do nothing;
