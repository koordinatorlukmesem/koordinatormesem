-- ============================================================
-- FAZ 2: Admin RLS politikaları + admin hesap kolonları
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================

-- admin_accounts kolonu (admin hesaplarını DB'de saklar — cihazlar arası senkron)
alter table public.app_config
  add column if not exists admin_accounts jsonb default '[]'::jsonb;

-- ---- Admin yardımcı fonksiyon ----
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- ---- app_config: admin okur + yazar (okul adı, import tarihi, admin hesapları) ----
drop policy if exists app_config_admin on public.app_config;
create policy app_config_admin on public.app_config
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- teachers: admin okur + yazar (sayım güncelleme) ----
drop policy if exists teachers_admin on public.teachers;
create policy teachers_admin on public.teachers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- teacher_secrets: admin okur (PIN görüntüleme) ----
drop policy if exists teacher_secrets_admin_read on public.teacher_secrets;
create policy teacher_secrets_admin_read on public.teacher_secrets
  for select to authenticated
  using (public.is_admin());

-- ---- teacher_secrets: öğretmen kendi PIN'ini güncelleyebilir ----
drop policy if exists teacher_secrets_own_update on public.teacher_secrets;
create policy teacher_secrets_own_update on public.teacher_secrets
  for update to authenticated
  using (teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id'))
  with check (teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id'));

-- ---- businesses: admin tüm işlemleri yapabilir (import) ----
drop policy if exists businesses_admin on public.businesses;
create policy businesses_admin on public.businesses
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- students: admin tüm işlemleri yapabilir (import) ----
drop policy if exists students_admin on public.students;
create policy students_admin on public.students
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- terminated: admin tüm işlemleri yapabilir (import) ----
drop policy if exists terminated_admin on public.terminated;
create policy terminated_admin on public.terminated
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
