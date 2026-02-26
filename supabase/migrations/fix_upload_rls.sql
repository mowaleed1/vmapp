-- 1. Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('audio-uploads', 'audio-uploads', false)
on conflict (id) do nothing;

-- 2. Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- 3. Policy to allow authenticated users to upload files to "audio-uploads"
create policy "Allow authenticated uploads" on storage.objects
for insert to authenticated
with check ( bucket_id = 'audio-uploads' );

-- 4. Policy to allow authenticated users to download/read their own or all files
create policy "Allow authenticated reads" on storage.objects
for select to authenticated
using ( bucket_id = 'audio-uploads' );

-- 5. Extra check for the database tables just in case the previous policies didn't apply
create policy "Permissive Insert on upload_batches" on upload_batches for insert to authenticated with check (true);
create policy "Permissive Insert on upload_files" on upload_files for insert to authenticated with check (true);
create policy "Permissive Update on upload_files" on upload_files for update to authenticated using (true);
