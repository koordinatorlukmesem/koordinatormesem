// Vercel Serverless Function (ESM) — yeni öğretmenleri service role ile oluşturur.
// Tarayıcı service role key kullanamaz; signUp ise proje ayarlarına (signup kapalı /
// e-posta onayı) takılır. Bu route admin.createUser ile güvenilir çalışır.
// Vercel Dashboard → Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY ekleyin.

import { createClient } from '@supabase/supabase-js'

const pinToPassword = (pin) => `msm-${String(pin)}`
const teacherEmail = (id) => `${id}@mesem.app`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil (Vercel env).' })
  }

  // Çağıranın admin olduğunu Supabase JWT ile doğrula
  const caller = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await caller.auth.getUser()
  if (userErr || !user || user.app_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // teachers: [{ id, name }]
  const { teachers } = req.body || {}
  if (!Array.isArray(teachers) || teachers.length === 0) return res.json({ created: [] })

  // Service role: RLS'i atlar, auth.admin kullanır
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const created = []
  const failed = []
  for (const t of teachers) {
    if (!t?.id || !t?.name) continue
    const email = teacherEmail(t.id)

    // 1. Auth kullanıcısı (zaten varsa atla, e-posta onaylı)
    const { error: cErr } = await admin.auth.admin.createUser({
      email,
      password: pinToPassword('1234'),
      email_confirm: true,
      app_metadata: { teacher_id: t.id },
    })
    if (cErr && !/already|registered|exists/i.test(cErr.message)) {
      console.error('createUser:', t.id, cErr.message)
      failed.push({ id: t.id, error: cErr.message })
      continue
    }

    // 2. teachers + teacher_secrets (upsert: idempotent)
    const { error: tErr } = await admin
      .from('teachers')
      .upsert({ id: t.id, name: t.name, business_count: 0, student_count: 0 }, { onConflict: 'id' })
    if (tErr) {
      console.error('teachers upsert:', t.id, tErr.message)
      failed.push({ id: t.id, error: tErr.message })
      continue
    }
    await admin
      .from('teacher_secrets')
      .upsert({ teacher_id: t.id, pin: '1234' }, { onConflict: 'teacher_id' })

    created.push({ id: t.id, name: t.name })
  }

  res.json({ created, failed })
}
