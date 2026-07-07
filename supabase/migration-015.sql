-- THE actual signup bug: handle_new_user() inserted a 'color' column that does
-- not exist on the live profiles table (PGRST/Postgres: "column color does not
-- exist"). Every new-user profile insert therefore failed. It surfaced first as
-- HTTP 500 "Database error saving new user", then (after we wrapped the trigger)
-- as accounts with no profile row and "cannot coerce the result to a single JSON
-- object" errors in the app.
--
-- Fix: insert only the required columns (id, username, name). Everything else on
-- profiles has a DB default, so this is robust even if the table's optional
-- columns differ from schema.sql.

create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text := split_part(coalesce(new.email, 'cheeky'), '@', 1);
  candidate text := base_username;
  n int := 0;
begin
  while exists (select 1 from profiles where username = candidate) loop
    n := n + 1;
    candidate := base_username || n::text;
  end loop;

  insert into profiles (id, username, name)
  values (new.id, candidate, base_username);

  insert into binders (owner_id, name, design) values
    (new.id, 'Cheki binder', 'classic'),
    (new.id, 'Cheki Settlements', 'classic');

  return new;
exception when others then
  -- never block signup — the app's ensureProfile() finishes provisioning on load
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
