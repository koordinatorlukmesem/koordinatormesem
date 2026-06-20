-- ============================================================
-- Realtime: admin yeni Excel yüklediğinde öğretmenlere anlık bildir
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================

-- 1. app_config tablosunu Realtime yayınına ekle
--    (zaten ekliyse "already member" hatası verir, önemli değil)
alter publication supabase_realtime add table public.app_config;

-- 2. Öğretmenler ve anonim kullanıcılar app_config'i okuyabilsin
--    (Realtime için de aynı RLS politikası gereklidir)
drop policy if exists app_config_read_all on public.app_config;
create policy app_config_read_all on public.app_config
  for select to anon, authenticated
  using (true);
