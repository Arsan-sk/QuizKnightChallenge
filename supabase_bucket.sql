-- Create the quiz-images bucket if it doesn't already exist
insert into storage.buckets (id, name, public) 
values ('quiz-images', 'quiz-images', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist (to ensure clean setup)
drop policy if exists "Public images" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;

-- Create policy to allow public read access to the images
create policy "Public images" 
on storage.objects for select 
using ( bucket_id = 'quiz-images' );

-- Create policy to allow authenticated users to upload images
create policy "Authenticated users can upload" 
on storage.objects for insert 
with check ( 
  bucket_id = 'quiz-images' 
  and auth.role() = 'authenticated' 
);

-- Policy to allow users to update their own uploads (optional, but good for completeness)
create policy "Users can update their own uploads"
on storage.objects for update
using ( bucket_id = 'quiz-images' and auth.role() = 'authenticated' );

-- Policy to allow users to delete their own uploads
create policy "Users can delete their own uploads"
on storage.objects for delete
using ( bucket_id = 'quiz-images' and auth.role() = 'authenticated' );
