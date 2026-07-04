-- Cheeky Chekis — migration 004
-- Fixes "permission denied for table ..." on saves.
--
-- The authenticated role could read the tables but was never granted
-- INSERT/UPDATE/DELETE, so every write was rejected at the privilege level
-- (before row-level security is even evaluated). RLS policies still restrict
-- WHICH rows each user can touch; these grants just allow the statements.
--
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- new tables added later inherit the same access
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
