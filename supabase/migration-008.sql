-- Cheeky Chekis — migration 008
-- Lets friends (and you) like a cheki.
-- Run once in the Supabase Dashboard SQL Editor. Safe to re-run.

create table if not exists cheki_likes (
  cheki_id uuid not null references chekis(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cheki_id, user_id)
);

alter table cheki_likes enable row level security;

drop policy if exists "see likes on chekis you can see" on cheki_likes;
create policy "see likes on chekis you can see"
  on cheki_likes for select to authenticated
  using (
    exists (
      select 1 from chekis c
      where c.id = cheki_id
        and (c.owner_id = auth.uid() or c.for_sale = true or are_friends(auth.uid(), c.owner_id))
    )
  );

drop policy if exists "like chekis you can see" on cheki_likes;
create policy "like chekis you can see"
  on cheki_likes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from chekis c
      where c.id = cheki_id
        and (c.owner_id = auth.uid() or c.for_sale = true or are_friends(auth.uid(), c.owner_id))
    )
  );

drop policy if exists "remove your own like" on cheki_likes;
create policy "remove your own like"
  on cheki_likes for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on cheki_likes to authenticated;
