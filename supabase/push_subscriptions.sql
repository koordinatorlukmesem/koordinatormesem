-- ============================================================
-- Push abonelikleri: arka plan bildirimleri için
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  text not null references public.teachers(id) on delete cascade,
  endpoint    text not null,
  subscription jsonb not null,
  created_at  timestamptz default now(),
  constraint push_sub_unique unique (teacher_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

-- Öğretmen yalnız kendi aboneliklerini yönetebilir
drop policy if exists push_sub_own on public.push_subscriptions;
create policy push_sub_own on public.push_subscriptions
  for all to authenticated
  using  (teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id'))
  with check (teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id'));

-- Admin tüm abonelikleri okuyabilir (push gönderimi: Vercel API route)
drop policy if exists push_sub_admin on public.push_subscriptions;
create policy push_sub_admin on public.push_subscriptions
  for select to authenticated
  using (public.is_admin());
