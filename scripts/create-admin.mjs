// Admin Supabase kullanıcısı oluşturur (admin@mesem.app, role=admin).
// Kullanım: node scripts/create-admin.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = {}
readFileSync('.env', 'utf8').split('\n').forEach((l) => {
  const eq = l.indexOf('=')
  if (eq > 0) env[l.slice(0, eq).trim()] = l.slice(eq + 1).trim()
})

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('.env içinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.')
  process.exit(1)
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMIN_EMAIL = 'admin@mesem.app'
const ADMIN_DB_PASS = env.ADMIN_DB_PASS || 'mesem-adm-2024'

const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
const existing = users?.find((u) => u.email === ADMIN_EMAIL)

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password: ADMIN_DB_PASS,
    app_metadata: { role: 'admin' },
    email_confirm: true,
  })
  if (error) { console.error('Güncelleme hatası:', error.message); process.exit(1) }
  console.log('Admin kullanıcısı güncellendi:', ADMIN_EMAIL)
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_DB_PASS,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  })
  if (error) { console.error('Oluşturma hatası:', error.message); process.exit(1) }
  console.log('Admin kullanıcısı oluşturuldu:', data.user.email)
}

console.log('Tamamlandı. Admin e-postası:', ADMIN_EMAIL)
