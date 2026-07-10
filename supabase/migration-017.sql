-- Multi-cafe chekis: a twin/group/4-cut can feature maids from several cafes,
-- so a cheki is now tagged with all the cafes involved (not just one).
-- cafe_id stays as the "primary" cafe for back-compat and pricing labels.

alter table chekis add column if not exists cafe_ids uuid[] not null default '{}';

-- backfill: existing chekis get their single cafe in the array
update chekis
  set cafe_ids = array[cafe_id]
  where cafe_id is not null and cafe_ids = '{}';
