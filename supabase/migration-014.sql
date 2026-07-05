-- Fix: new users cannot create accounts (signup returns HTTP 500
-- "Database error saving new user").
--
-- Cause: handle_new_user() raises, and because it runs inside the auth.users
-- insert transaction, Postgres rolls the whole signup back. Any failing line
-- (profile insert, binder insert, a constraint, a missing default) takes down
-- account creation entirely.
--
-- Fix: the trigger still does its best to create the profile + starter binders,
-- but the ENTIRE body is wrapped so it can never abort signup. If anything
-- fails it logs a warning and lets the auth user through; the app's
-- ensureProfile() safety net then creates whatever is missing on first load.

create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text := split_part(coalesce(new.email, 'cheeky'), '@', 1);
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

  insert into binders (owner_id, name, design) values
    (new.id, 'Cheki binder', 'classic'),
    (new.id, 'Cheki Settlements', 'classic');

  return new;
exception when others then
  -- never block signup — the app finishes provisioning on first load
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
