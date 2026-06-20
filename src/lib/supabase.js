import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.warn('Supabase ortam değişkenleri eksik (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
}

// Öğretmen oturumu (teacher_id RLS)
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'mesem.supabase.auth',
  },
})

// Admin oturumu (role=admin RLS) — ayrı storage key ile çakışmaz
export const adminSupabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'mesem.supabase.admin',
  },
})

// Sabit admin Supabase kullanıcısı (create-admin.mjs ile oluşturulur)
export const ADMIN_EMAIL = 'admin@mesem.app'
export const ADMIN_DB_PASS = 'mesem-adm-2024'

export const pinToPassword = (pin) => `msm-${String(pin)}`
export const teacherEmail = (teacherId) => `${teacherId}@mesem.app`
