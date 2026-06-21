-- ============================================================
-- Son yüklenen Excel dosya adı (profilde gösterilir)
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================
alter table public.app_config
  add column if not exists last_import_file text;
