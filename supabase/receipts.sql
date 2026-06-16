-- טבלת קבלות (סורק קבלות)
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  total_price numeric not null default 0,
  vat numeric not null default 0,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;

drop policy if exists "receipts_select" on public.receipts;
drop policy if exists "receipts_all" on public.receipts;

create policy "receipts_select" on public.receipts
  for select using (auth.uid() is not null);

create policy "receipts_all" on public.receipts
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- אחסון לתמונות הקבלות (Storage bucket)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "receipts_storage_read" on storage.objects;
drop policy if exists "receipts_storage_write" on storage.objects;

create policy "receipts_storage_read" on storage.objects
  for select using (bucket_id = 'receipts');

create policy "receipts_storage_write" on storage.objects
  for all using (bucket_id = 'receipts' and auth.uid() is not null)
  with check (bucket_id = 'receipts' and auth.uid() is not null);
