-- ============================================================
-- Koordinatör MESEM — Supabase şema (FAZ 1: okuma + giriş)
-- Supabase Dashboard > SQL Editor'da bu dosyanın tamamını çalıştırın.
-- ============================================================

-- ---- Genel ayar (okul adı, son liste tarihi) — herkese açık okuma ----
create table if not exists public.app_config (
  id int primary key default 1,
  school text not null default 'Okul Adı',
  last_import_date date,
  last_import_label text,
  constraint app_config_singleton check (id = 1)
);

-- ---- Öğretmenler (giriş ekranındaki liste için anon okunur; PIN burada YOK) ----
create table if not exists public.teachers (
  id text primary key,
  name text not null,
  business_count int default 0,
  student_count int default 0,
  auth_id uuid
);

-- ---- Öğretmen PIN'leri (yalnız servis/admin erişir; clientten okunamaz) ----
create table if not exists public.teacher_secrets (
  teacher_id text primary key references public.teachers(id) on delete cascade,
  pin text not null
);

-- ---- İşletmeler ----
create table if not exists public.businesses (
  id text primary key,
  teacher_id text not null references public.teachers(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  dal text,
  usta text,
  is_new boolean default false
);
create index if not exists businesses_teacher_idx on public.businesses(teacher_id);

-- ---- Öğrenciler (RLS kolaylığı için teacher_id denormalize) ----
create table if not exists public.students (
  id text primary key,
  business_id text not null references public.businesses(id) on delete cascade,
  teacher_id text not null references public.teachers(id) on delete cascade,
  no text,
  name text,
  sinif text,
  sube text,
  dal text,
  usta text,
  tel text,
  devamsizlik text,
  ise_giris date,
  is_new boolean default false
);
create index if not exists students_teacher_idx on public.students(teacher_id);
create index if not exists students_business_idx on public.students(business_id);

-- ---- Fesih (önceki listede olup yenide olmayan öğrenciler) ----
create table if not exists public.terminated (
  id bigserial primary key,
  teacher_id text not null references public.teachers(id) on delete cascade,
  name text,
  no text,
  sube text,
  tel text,
  business_name text,
  date date
);
create index if not exists terminated_teacher_idx on public.terminated(teacher_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.app_config       enable row level security;
alter table public.teachers         enable row level security;
alter table public.teacher_secrets  enable row level security;
alter table public.businesses       enable row level security;
alter table public.students         enable row level security;
alter table public.terminated       enable row level security;

-- JWT'deki app_metadata.teacher_id -> giriş yapan öğretmenin id'si
-- (migration, auth kullanıcısını bu metadata ile oluşturur)

-- app_config: herkes okuyabilir (okul adı login + header'da görünür)
drop policy if exists app_config_read on public.app_config;
create policy app_config_read on public.app_config
  for select using (true);

-- teachers: herkes okuyabilir (giriş ekranı listesi). Yazma yok (servis hariç).
drop policy if exists teachers_read on public.teachers;
create policy teachers_read on public.teachers
  for select using (true);

-- teacher_secrets: hiçbir client okuyamaz/yazamaz (yalnız service_role).
-- (Policy tanımlamıyoruz -> RLS açık + policy yok = erişim reddedilir.)

-- businesses: öğretmen yalnız kendi işletmelerini okur
drop policy if exists businesses_read_own on public.businesses;
create policy businesses_read_own on public.businesses
  for select using (
    teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id')
  );

-- students: öğretmen yalnız kendi öğrencilerini okur
drop policy if exists students_read_own on public.students;
create policy students_read_own on public.students
  for select using (
    teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id')
  );

-- terminated: öğretmen yalnız kendi fesihlerini okur
drop policy if exists terminated_read_own on public.terminated;
create policy terminated_read_own on public.terminated
  for select using (
    teacher_id = (auth.jwt() -> 'app_metadata' ->> 'teacher_id')
  );

-- NOT: gruplar, kontroller, admin yönetimi ve Excel yazımı FAZ 2'de eklenecek.
