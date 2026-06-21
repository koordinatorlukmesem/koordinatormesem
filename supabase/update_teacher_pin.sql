-- ============================================================
-- Öğretmen PIN güncelleme fonksiyonu
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent)
-- ============================================================
-- app_metadata.teacher_id olmayan eski öğretmenler için de çalışır;
-- çağıranın e-postasından teacher_id türetir (güvenli: kendi kaydını değiştirir).

create or replace function public.update_teacher_pin(new_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email      text;
  v_teacher_id text;
begin
  select email into v_email
  from auth.users
  where id = auth.uid();

  if v_email is null or v_email not like '%@mesem.app' or v_email = 'admin@mesem.app' then
    raise exception 'Geçersiz hesap türü';
  end if;

  v_teacher_id := split_part(v_email, '@', 1);

  -- Upsert: teacher_secrets satırı yoksa (eski öğretmenler) oluştur, varsa güncelle.
  insert into public.teacher_secrets (teacher_id, pin)
  values (v_teacher_id, new_pin)
  on conflict (teacher_id) do update set pin = excluded.pin;
end;
$$;
