-- ============================================================
-- FAZ 3: Öğretmen durum senkronizasyonu (gruplar, kontroller, ack)
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================

create table if not exists public.teacher_state (
  teacher_id text primary key references public.teachers(id) on delete cascade,
  groups     jsonb  not null default '[]'::jsonb,
  controls   jsonb  not null default '{}'::jsonb,
  ack        jsonb  not null default '[]'::jsonb,
  seen_import_date date
);

alter table public.teacher_state enable row level security;

-- Öğretmen yalnız kendi satırını okur ve yazar
drop policy if exists teacher_state_own on public.teacher_state;
create policy teacher_state_own on public.teacher_state
  for all to authenticated
  using  (teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id'))
  with check (teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id'));

-- Admin tüm satırlara erişir (import temizleme vb.)
drop policy if exists teacher_state_admin on public.teacher_state;
create policy teacher_state_admin on public.teacher_state
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
