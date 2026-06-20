-- ============================================================
-- Yeni öğretmen kurulumu
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================

-- 1. BEFORE INSERT trigger: yeni @mesem.app kullanıcısı açılınca
--    app_metadata.teacher_id e-postadan otomatik set edilir.
--    importExcel'de adminSupabase.auth.signUp() yeterli olur,
--    service role key gerekmez.
create or replace function public.set_teacher_id_on_signup()
returns trigger as $$
begin
  if new.email like '%@mesem.app' and new.email != 'admin@mesem.app' then
    new.raw_app_meta_data =
      coalesce(new.raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object('teacher_id', split_part(new.email, '@', 1));
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_teacher_id_on_signup on auth.users;
create trigger set_teacher_id_on_signup
  before insert on auth.users
  for each row execute procedure public.set_teacher_id_on_signup();

-- 2. teacher_secrets Realtime yayınına ekle:
--    admin paneli öğretmen PIN değişikliklerini anlık görsün.
alter publication supabase_realtime add table public.teacher_secrets;
