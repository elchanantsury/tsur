-- הרץ ב-Supabase SQL Editor

-- הערות בין מנהל על למנהל
create table if not exists public.manager_notes (
  id uuid primary key default gen_random_uuid(),
  branch_name text,
  is_other boolean not null default false,
  category text not null default 'general'
    check (category in ('general', 'urgent', 'update', 'request', 'info')),
  message text not null,
  from_user_id uuid references auth.users(id) on delete set null,
  from_name text,
  from_role text not null check (from_role in ('admin', 'manager')),
  to_role text not null check (to_role in ('admin', 'manager')),
  created_at timestamptz not null default now()
);

-- התראות באפליקציה
create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('branch_closed', 'sos', 'manager_note', 'system')),
  title text not null,
  message text not null,
  link text not null default '/',
  branch_name text,
  target_role text not null default 'both'
    check (target_role in ('admin', 'manager', 'both')),
  created_by_name text,
  created_at timestamptz not null default now()
);

-- מי קרא התראה
create table if not exists public.notification_reads (
  notification_id uuid references public.app_notifications(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists manager_notes_created_idx on public.manager_notes (created_at desc);
create index if not exists app_notifications_created_idx on public.app_notifications (created_at desc);

alter table public.manager_notes enable row level security;
alter table public.app_notifications enable row level security;
alter table public.notification_reads enable row level security;

-- helper: מנהל או מנהל על
create or replace function public.is_manager_or_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'manager')
  );
$$;

drop policy if exists "notes_select" on public.manager_notes;
drop policy if exists "notes_insert" on public.manager_notes;
drop policy if exists "notes_delete" on public.manager_notes;

create policy "notes_select" on public.manager_notes for select
  using (public.is_manager_or_admin());

create policy "notes_insert" on public.manager_notes for insert
  with check (public.is_manager_or_admin());

create policy "notes_delete" on public.manager_notes for delete
  using (public.is_manager_or_admin());

drop policy if exists "notif_select" on public.app_notifications;
drop policy if exists "notif_insert" on public.app_notifications;

create policy "notif_select" on public.app_notifications for select
  using (public.is_manager_or_admin());

-- כולל עובדים שסוגרים סניף — כל משתמש מחובר
create policy "notif_insert" on public.app_notifications for insert
  with check (auth.uid() is not null);

drop policy if exists "reads_all" on public.notification_reads;

create policy "reads_all" on public.notification_reads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
