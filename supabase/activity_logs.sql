-- ============================================================
-- Giriş / Çıkış kayıtları (tüm cihazlar) — süper admin görüntüler
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================

create table if not exists public.activity_logs (
  id     bigserial primary key,
  ts     timestamptz not null default now(),
  name   text,
  role   text,
  action text
);
create index if not exists activity_logs_ts_idx on public.activity_logs (ts desc);

alter table public.activity_logs enable row level security;

-- Giriş yapan herkes (öğretmen + admin) kendi giriş/çıkış kaydını ekleyebilir
drop policy if exists activity_logs_insert on public.activity_logs;
create policy activity_logs_insert on public.activity_logs
  for insert to authenticated
  with check (true);

-- Yalnız admin (süper admin paneli) tüm kayıtları okuyabilir
drop policy if exists activity_logs_admin_read on public.activity_logs;
create policy activity_logs_admin_read on public.activity_logs
  for select to authenticated
  using (public.is_admin());
