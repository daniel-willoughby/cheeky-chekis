-- Cheki settlements: extra photos attached to an existing cheki.
-- A settlement is itself a cheki row that points at its parent via
-- settlement_of. It inherits the parent's maid_ids / cafe_id / date, lives
-- in a dedicated "Cheki Settlements" binder, and is hidden from the normal
-- collection views (which filter on settlement_of is null).
alter table chekis
  add column if not exists settlement_of uuid references chekis(id) on delete cascade;

create index if not exists chekis_settlement_of_idx on chekis(settlement_of);
