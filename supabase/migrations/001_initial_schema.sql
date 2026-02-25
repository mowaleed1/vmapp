-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES
create table roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default roles
insert into roles (name, description) values
  ('admin', 'System administrator with full access'),
  ('agent', 'Customer support agent'),
  ('viewer', 'Read-only access');

-- ORGANIZATIONS
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TEAMS
create table teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  organization_id uuid references organizations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USERS (Extends Supabase Auth Auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role_id uuid references roles(id),
  team_id uuid references teams(id),
  organization_id uuid references organizations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SLA POLICIES
create table sla_policies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  priority text not null, -- 'low', 'medium', 'high', 'critical'
  response_time_minutes integer not null,
  resolution_time_minutes integer not null,
  organization_id uuid references organizations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKETS
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  transcript text,
  summary text,
  priority text default 'medium',
  status text default 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  category text,
  requester_id uuid references users(id),
  assigned_to uuid references users(id),
  team_id uuid references teams(id),
  organization_id uuid references organizations(id),
  sla_policy_id uuid references sla_policies(id),
  sla_breach_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKET COMMENTS
create table ticket_comments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id) on delete cascade not null,
  author_id uuid references users(id) not null,
  body text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKET ATTACHMENTS
create table ticket_attachments (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id) on delete cascade not null,
  comment_id uuid references ticket_comments(id) on delete cascade,
  uploaded_by uuid references users(id) not null,
  file_name text not null,
  file_size_bytes integer not null,
  file_type text not null,
  storage_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKET ACTIVITY LOGS
create table ticket_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id) on delete cascade not null,
  actor_id uuid references users(id),
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- UPLOAD BATCHES
create table upload_batches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) not null,
  total_files integer not null,
  status text default 'processing', -- 'processing', 'completed', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- UPLOAD FILES
create table upload_files (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references upload_batches(id) on delete cascade not null,
  user_id uuid references users(id) not null,
  file_name text not null,
  file_size_bytes integer not null,
  storage_path text not null,
  status text default 'uploading', -- 'uploading', 'transcribing', 'summarizing', 'completed', 'failed'
  transcript text,
  error_message text,
  ticket_id uuid references tickets(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) SETUP

-- Enable RLS on all tables
alter table roles enable row level security;
alter table organizations enable row level security;
alter table teams enable row level security;
alter table users enable row level security;
alter table sla_policies enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;
alter table ticket_attachments enable row level security;
alter table ticket_activity_logs enable row level security;
alter table upload_batches enable row level security;
alter table upload_files enable row level security;

-- Very permissive RLS policies for initial development and testing
-- In a real production app, these would be heavily restricted based on roles
-- and team/organization association.

create policy "Enable all access for authenticated users" on roles for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on organizations for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on teams for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on users for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on sla_policies for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on tickets for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on ticket_comments for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on ticket_attachments for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on ticket_activity_logs for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on upload_batches for all to authenticated using (true) with check (true);
create policy "Enable all access for authenticated users" on upload_files for all to authenticated using (true) with check (true);

-- Function to handle new user signups automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
