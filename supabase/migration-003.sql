-- Cheeky Chekis — migration 003
-- Per-cheki-type prices for cafes (e.g. pin 8000, homework 12000).
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

alter table cafes add column if not exists type_prices jsonb not null default '{}'::jsonb;
