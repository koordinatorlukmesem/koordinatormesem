// Vercel Serverless Function (ESM) — öğretmenlere Web Push bildirimi gönderir.
// Vercel Dashboard → Settings → Environment Variables → VAPID_PRIVATE_KEY ekleyin.

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const VAPID_PUBLIC_KEY =
  'BF_5imh8Tm6i_FTpkjpMvCtzJuad87JVIfWsQFu5io8ch9BtYX6glQQ8roQs60dKUcPpWZ8tqpfmzi7q0u6f2nQ'

webpush.setVapidDetails(
  'mailto:admin@mesem.app',
  VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

// Verilen abonelik listesine tek bir bildirimi gönderir; süresi dolanları toplar.
async function pushToSubs(subs, payloadStr, expiredIds) {
  let sent = 0
  await Promise.allSettled(
    subs.map(async ({ id, sub }) => {
      try {
        await webpush.sendNotification(sub, payloadStr)
        sent++
      } catch (err) {
        console.error('Push send error:', err.statusCode, err.message)
        if (err.statusCode === 410 || err.statusCode === 404) expiredIds.push(id)
      }
    }),
  )
  return sent
}

export default async function handler(req, res) {
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

  // importLabel: "20 Haziran" formatı
  // fileName: "liste.xlsx" — tüm kullanıcı bildiriminde gösterilir
  // teacherStats: sadece yeni öğesi olan öğretmenler { tid: { newBiz, newStu } }
  const { importLabel, fileName, teacherStats } = req.body

  // Admin JWT ile tüm abonelikleri oku (RLS: push_sub_admin policy)
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('id, teacher_id, subscription')

  if (subsErr) {
    console.error('push_subscriptions read error:', subsErr.message)
    return res.status(500).json({ error: subsErr.message })
  }

  // Öğretmene göre abonelik haritası
  const subsByTeacher = {}
  for (const s of subs || []) {
    ;(subsByTeacher[s.teacher_id] ||= []).push({ id: s.id, sub: s.subscription })
  }

  const expiredIds = []
  let sent = 0

  // ── 1. Tüm abonelere: "Liste güncellendi" bildirimi ──────────────────────
  const fileLabel = fileName ? ` (${fileName})` : ''
  const updatePayload = JSON.stringify({
    title: 'İşletme Listesi Güncellendi',
    body: `İşletme Listesi Yönetici Tarafından Güncellendi.${fileLabel}`,
    tag: 'import-update',
  })
  for (const teacherSubs of Object.values(subsByTeacher)) {
    sent += await pushToSubs(teacherSubs, updatePayload, expiredIds)
  }

  // ── 2. Yeni işletme/öğrencisi olan öğretmenlere ek bildirimler ────────────
  for (const [tid, stats] of Object.entries(teacherStats || {})) {
    const teacherSubs = subsByTeacher[tid] || []
    if (!teacherSubs.length) continue

    if (stats.newBiz > 0) {
      const payload = JSON.stringify({
        title: 'Yeni İşletme Eklendi',
        body: `${stats.newBiz} yeni işletme listenize eklendi.`,
        tag: 'import-biz',
      })
      sent += await pushToSubs(teacherSubs, payload, expiredIds)
    }

    if (stats.newStu > 0) {
      const payload = JSON.stringify({
        title: 'Yeni Öğrenci Eklendi',
        body: `${stats.newStu} yeni öğrenci listenize eklendi.`,
        tag: 'import-stu',
      })
      sent += await pushToSubs(teacherSubs, payload, expiredIds)
    }
  }

  // Süresi dolmuş abonelikleri sil
  if (expiredIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredIds)
  }

  res.json({ sent, expired: expiredIds.length })
}
