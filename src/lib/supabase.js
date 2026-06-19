import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  // .env.local içine VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin
  console.warn('Supabase ortam değişkenleri eksik (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true, // oturum kalıcı (çıkışa kadar açık kalır)
    autoRefreshToken: true,
    storageKey: 'mesem.supabase.auth',
  },
})

// Öğretmen PIN'ini Supabase Auth parolasına çevirir (min 6 karakter şartı için).
// Giriş ve migration aynı dönüşümü kullanmalı.
export const pinToPassword = (pin) => `msm-${String(pin)}`

// Öğretmen id'sinden otomatik e-posta.
export const teacherEmail = (teacherId) => `${teacherId}@mesem.app`
