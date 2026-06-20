// Vercel Serverless Function — öğretmenlere Web Push bildirimi gönderir.
// Otomatik deploy olur (api/ klasörü Vercel tarafından algılanır).
// Vercel Dashboard → Settings → Environment Variables → VAPID_PRIVATE_KEY ekleyin.

const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

const VAPID_PUBLIC_KEY =
  'BF_5imh8Tm6i_FTpkjpMvCtzJuad87JVIfWsQFu5io8ch9BtYX6glQQ8roQs60dKUcPpWZ8tqpfmzi7q0u6f2nQ'

webpush.setVapidDetails(
  'mailto:admin@mesem.app',
  VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  // Çağıranın admin olduğunu Supabase JWT ile doğrula
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user || user.app_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { importLabel, teacherStats } = req.body

  // Admin JWT ile tüm abonelikleri oku (RLS: push_sub_admin policy)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, teacher_id, subscription')

  // Öğretmene göre abonelik haritası
  const subsByTeacher = {}
  for (const s of subs || []) {
    ;(subsByTeacher[s.teacher_id] ||= []).push({ id: s.id, sub: s.subscription })
  }

  const expiredIds = []
  let sent = 0

  for (const [tid, stats] of Object.entries(teacherStats || {})) {
    const teacherSubs = subsByTeacher[tid] || []
    if (!teacherSubs.length) continue

    const parts = []
    if (stats.newBiz > 0) parts.push(`${stats.newBiz} yeni işletme`)
    if (stats.newStu > 0) parts.push(`${stats.newStu} yeni öğrenci`)
    const body =
      parts.length > 0
        ? `${importLabel} listesinde ${parts.join(', ')} eklendi.`
        : `${importLabel} tarihli liste güncellendi.`
    const payload = JSON.stringify({ title: 'Yeni Liste Yüklendi', body, tag: 'import' })

    await Promise.allSettled(
      teacherSubs.map(async ({ id, sub }) => {
        try {
          await webpush.sendNotification(sub, payload)
          sent++
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) expiredIds.push(id)
        }
      }),
    )
  }

  // Süresi dolmuş abonelikleri sil
  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  res.json({ sent, expired: expiredIds.length })
}
