// Supabase Edge Function — öğretmenlere Web Push bildirimi gönderir.
//
// Kurulum (bir kez yapılır):
//   1. Supabase Dashboard → Settings → Edge Functions → Secrets:
//      VAPID_PUBLIC_KEY  = BF_5imh8Tm6i_FTpkjpMvCtzJuad87JVIfWsQFu5io8ch9BtYX6glQQ8roQs60dKUcPpWZ8tqpfmzi7q0u6f2nQ
//      VAPID_PRIVATE_KEY = ZXbqzZBCK00Xfq2N5YRnyxEtFJij8DpvF167bhgaFmM
//   2. Bu dosyayı deploy edin:
//      npx supabase functions deploy send-push --project-ref <proje-ref>
//      VEYA Dashboard → Edge Functions → New Function → "send-push" → kodu yapıştırın

// deno-lint-ignore-file
// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

webpush.setVapidDetails(
  'mailto:admin@mesem.app',
  Deno.env.get('VAPID_PUBLIC_KEY'),
  Deno.env.get('VAPID_PRIVATE_KEY'),
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Çağıranın admin olduğunu doğrula
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user || user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // importLabel ve öğretmen başına yeni işletme/öğrenci sayıları
    const { importLabel, teacherStats } = await req.json()

    // Tüm abonelikleri service role ile çek (RLS bypass)
    const sc = createClient(supabaseUrl, serviceKey)
    const { data: subs } = await sc
      .from('push_subscriptions')
      .select('id, teacher_id, subscription')

    // Öğretmene göre abonelik haritası
    const subsByTeacher = {}
    for (const s of (subs || [])) {
      ;(subsByTeacher[s.teacher_id] ||= []).push({ id: s.id, sub: s.subscription })
    }

    const expiredIds = []
    let sent = 0

    for (const [tid, stats] of Object.entries(teacherStats || {})) {
      const teacherSubs = subsByTeacher[tid] || []
      if (teacherSubs.length === 0) continue

      // Kişiselleştirilmiş bildirim içeriği
      const parts = []
      if (stats.newBiz > 0) parts.push(`${stats.newBiz} yeni işletme`)
      if (stats.newStu > 0) parts.push(`${stats.newStu} yeni öğrenci`)
      const body = parts.length > 0
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

    // Süresi dolmuş abonelikleri temizle
    if (expiredIds.length > 0) {
      await sc.from('push_subscriptions').delete().in('id', expiredIds)
    }

    return new Response(
      JSON.stringify({ sent, expired: expiredIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
