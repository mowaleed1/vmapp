-- Migration: 005_auth_trigger
-- Description: Creates a trigger that automatically inserts a new row into the public.users table when a user signs up.

-- Create the function that will be called by the trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.created_at, now()),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger on the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
