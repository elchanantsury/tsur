-- הרץ ב-Supabase SQL Editor ליצירת טבלת SOS

create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  branch_name text not null,
  note text not null,
  urgency text not null check (urgency in ('low', 'medium', 'high', 'critical')),
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists sos_alerts_status_idx on public.sos_alerts (status);
create index if not exists sos_alerts_created_at_idx on public.sos_alerts (created_at desc);

alter table public.sos_alerts enable row level security;

drop policy if exists "sos_select_managers" on public.sos_alerts;
drop policy if exists "sos_insert_managers" on public.sos_alerts;
drop policy if exists "sos_update_managers" on public.sos_alerts;
drop policy if exists "sos_delete_managers" on public.sos_alerts;

create policy "sos_select_managers"
  on public.sos_alerts for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

create policy "sos_insert_managers"
  on public.sos_alerts for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

create policy "sos_update_managers"
  on public.sos_alerts for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

create policy "sos_delete_managers"
  on public.sos_alerts for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );
