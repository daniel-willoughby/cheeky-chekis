-- Cheeky Chekis — migration 009
-- The old placeholder binder designs (sakura, midnight, arcade, candy) are
-- removed from the app's design catalog; update the default so new
-- profiles don't start owning ids that no longer exist.
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

alter table profiles alter column owned_designs set default '{classic}';
