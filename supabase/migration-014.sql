-- Fix: new users could not create accounts.
--
-- If anything in handle_new_user() raises, Postgres rolls back the whole
-- auth.users insert and Supabase reports "Database error saving new user" — so
-- a failure in the (non-essential) starter-binder inserts blocks signup
-- entirely. This makes the trigger fault-tolerant: the profile row is the only
-- critical part; starter binders are created in a guarded block that can never
-- abort account creation.

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

  -- starter binders are a nicety, not a requirement — never let them block signup
  begin
    insert into binders (owner_id, name, design) values
      (new.id, 'Cheki binder', 'classic'),
      (new.id, 'Cheki Settlements', 'classic');
  exception when others then
    raise warning 'handle_new_user: starter binders skipped for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
