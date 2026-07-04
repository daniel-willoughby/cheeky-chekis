-- Cheeky Chekis — migration 005
-- Removes the placeholder demo cafes/maids seeded by the original schema.sql
-- (Lumiere Maid Cafe, Neko Neko Cha, Starlight Terrace and their maids), so
-- real cafe/maid data can be entered manually from a clean slate.
--
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

delete from maids where cafe_id in (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103'
);

delete from cafes where id in (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103'
);
