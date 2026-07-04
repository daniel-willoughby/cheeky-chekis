-- Cheeky Chekis — migration 002
-- Adds image support (profile avatars, cafe + maid photos) and lets any
-- signed-in user add cafes / add + edit maids.
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

-- ---- image path columns ----
alter table profiles add column if not exists avatar_path text;
alter table cafes    add column if not exists image_path text;
alter table maids    add column if not exists image_path text;

-- ---- cafes: allow inserts (shared reference data) ----
drop policy if exists "any signed-in user can add a cafe" on cafes;
create policy "any signed-in user can add a cafe"
  on cafes for insert to authenticated with check (true);

-- ---- maids: allow inserts + updates ----
drop policy if exists "any signed-in user can add a maid" on maids;
create policy "any signed-in user can add a maid"
  on maids for insert to authenticated with check (true);

drop policy if exists "any signed-in user can edit a maid" on maids;
create policy "any signed-in user can edit a maid"
  on maids for update to authenticated using (true);

-- ---- storage: shared images bucket (avatars, cafe + maid photos) ----
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images are publicly readable" on storage.objects;
create policy "images are publicly readable"
  on storage.objects for select using (bucket_id = 'images');

drop policy if exists "signed-in users can upload images" on storage.objects;
create policy "signed-in users can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images');

drop policy if exists "signed-in users can replace images" on storage.objects;
create policy "signed-in users can replace images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images');
