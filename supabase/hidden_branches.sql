-- סניפים שהוסתרו/נמחקו מהרשימה (ניתן לשחזר ע"י מחיקת השורה)
create table if not exists public.hidden_branches (
  branch_name text primary key,
  created_at timestamptz not null default now()
);

alter table public.hidden_branches enable row level security;

drop policy if exists "hidden_branches_select" on public.hidden_branches;
drop policy if exists "hidden_branches_all" on public.hidden_branches;

create policy "hidden_branches_select" on public.hidden_branches
  for select using (auth.uid() is not null);

create policy "hidden_branches_all" on public.hidden_branches
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);
