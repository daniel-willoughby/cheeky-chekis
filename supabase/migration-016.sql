-- Admin permissions: only admins can add/edit/delete cafes & maids.
-- Admins also get a pink "Admin" badge in the app.

-- 1) admin flag on profiles
alter table profiles add column if not exists is_admin boolean not null default false;

-- designate the admin accounts (match on username)
update profiles set is_admin = true
where username in ('holakittybel', 'winter', 'sarah', 'd.t.willoughby');

-- helper: is this user an admin? (security definer so RLS can call it)
create or replace function is_admin(uid uuid)
returns boolean as $$
  select coalesce((select is_admin from profiles where id = uid), false);
$$ language sql security definer stable set search_path = public;

-- 2) cafes: create/edit/delete are admin-only (reads stay open)
drop policy if exists "any signed-in user can add a cafe" on cafes;
create policy "admins can add a cafe"
  on cafes for insert to authenticated with check (is_admin(auth.uid()));

drop policy if exists "any signed-in user can edit cafe info" on cafes;
create policy "admins can edit cafe info"
  on cafes for update to authenticated using (is_admin(auth.uid()));

drop policy if exists "any signed-in user can delete a cafe" on cafes;
create policy "admins can delete a cafe"
  on cafes for delete to authenticated using (is_admin(auth.uid()));

-- 3) maids: create/edit/delete are admin-only (reads stay open)
drop policy if exists "any signed-in user can add a maid" on maids;
create policy "admins can add a maid"
  on maids for insert to authenticated with check (is_admin(auth.uid()));

drop policy if exists "any signed-in user can edit a maid" on maids;
create policy "admins can edit a maid"
  on maids for update to authenticated using (is_admin(auth.uid()));

drop policy if exists "any signed-in user can delete a maid" on maids;
create policy "admins can delete a maid"
  on maids for delete to authenticated using (is_admin(auth.uid()));
