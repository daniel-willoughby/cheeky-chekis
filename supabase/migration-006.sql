-- Cheeky Chekis — migration 006
-- Adds maid "graduated" status, and lets any signed-in user delete a cafe
-- or maid (RLS keeps this open to any signed-in user, same as add/edit).
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

-- ---- maids: graduated flag ----
alter table maids add column if not exists graduated boolean not null default false;

-- ---- cafes: allow deletes ----
drop policy if exists "any signed-in user can delete a cafe" on cafes;
create policy "any signed-in user can delete a cafe"
  on cafes for delete to authenticated using (true);

-- ---- maids: allow deletes ----
drop policy if exists "any signed-in user can delete a maid" on maids;
create policy "any signed-in user can delete a maid"
  on maids for delete to authenticated using (true);

-- ---- chekis: don't block cafe deletion, just clear the reference ----
alter table chekis drop constraint if exists chekis_cafe_id_fkey;
alter table chekis add constraint chekis_cafe_id_fkey
  foreign key (cafe_id) references cafes(id) on delete set null;
