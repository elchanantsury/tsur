-- עריכות פרטי סניף (שמירה מעל הנתונים בקוד)
create table if not exists public.branch_overrides (
  branch_name text primary key,
  manager text,
  phone text,
  cell text,
  address text,
  updated_at timestamptz not null default now()
);

alter table public.branch_overrides enable row level security;

drop policy if exists "branch_overrides_select" on public.branch_overrides;
drop policy if exists "branch_overrides_upsert" on public.branch_overrides;

create policy "branch_overrides_select" on public.branch_overrides
  for select using (auth.uid() is not null);

create policy "branch_overrides_upsert" on public.branch_overrides
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);
