-- The frontend (and OAuth providers) put the display name in raw_user_meta_data
-- as "full_name", not "name". Read both so the profile name is filled in.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

-- Backfill accounts created before this fix.
update users u
set name = coalesce(a.raw_user_meta_data ->> 'full_name', a.raw_user_meta_data ->> 'name')
from auth.users a
where a.id = u.id and u.name is null;
