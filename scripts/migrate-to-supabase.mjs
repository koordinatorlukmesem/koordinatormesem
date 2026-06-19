// seed.json -> Supabase (tablolar + öğretmen auth kullanıcıları)
// Çalıştırma: node scripts/migrate-to-supabase.mjs
// Gerekli env (.env dosyasından okunur): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// --- basit .env yükleyici ---
const envPath = resolve(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Eksik env: SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (.env içine ekleyin).')
  process.exit(1)
}

const pinToPassword = (pin) => `msm-${String(pin)}`
const teacherEmail = (id) => `${id}@mesem.app`

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const seed = JSON.parse(readFileSync(resolve(root, 'src/data/seed.json'), 'utf8'))

const chunk = (arr, n) => {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}
async function upsertAll(table, rows, onConflict) {
  for (const part of chunk(rows, 500)) {
    const { error } = await supabase.from(table).upsert(part, { onConflict })
    if (error) throw new Error(`${table}: ${error.message}`)
  }
  console.log(`  ${table}: ${rows.length} satır`)
}

async function main() {
  console.log('1) app_config')
  await supabase.from('app_config').upsert({
    id: 1,
    school: seed.school,
    last_import_date: seed.lastImportDate,
    last_import_label: seed.lastImportLabel,
  })

  console.log('2) teachers / teacher_secrets')
  await upsertAll(
    'teachers',
    seed.teachers.map((t) => ({
      id: t.id, name: t.name, business_count: t.businessCount, student_count: t.studentCount,
    })),
    'id',
  )
  await upsertAll(
    'teacher_secrets',
    seed.teachers.map((t) => ({ teacher_id: t.id, pin: t.pin })),
    'teacher_id',
  )

  console.log('3) businesses')
  await upsertAll(
    'businesses',
    seed.businesses.map((b) => ({
      id: b.id, teacher_id: b.teacherId, name: b.name, phone: b.phone,
      address: b.address, dal: b.dal, usta: b.usta, is_new: b.isNew,
    })),
    'id',
  )

  console.log('4) students')
  const students = []
  for (const b of seed.businesses) {
    for (const s of b.students) {
      students.push({
        id: s.id, business_id: b.id, teacher_id: b.teacherId, no: s.no, name: s.name,
        sinif: s.sinif, sube: s.sube, dal: s.dal, usta: s.usta, tel: s.tel,
        devamsizlik: s.devamsizlik, ise_giris: s.iseGiris, is_new: s.isNew,
      })
    }
  }
  await upsertAll('students', students, 'id')

  console.log('5) terminated (önce temizle)')
  await supabase.from('terminated').delete().neq('id', -1)
  await upsertAll(
    'terminated',
    (seed.terminated || []).map((t) => ({
      teacher_id: t.teacherId, name: t.name, no: t.no, sube: t.sube,
      tel: t.tel, business_name: t.businessName, date: t.date,
    })),
  )

  console.log('6) öğretmen auth kullanıcıları (e-posta + PIN)')
  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const byEmail = new Map((existing?.users || []).map((u) => [u.email, u]))
  let created = 0
  let updated = 0
  for (const t of seed.teachers) {
    const email = teacherEmail(t.id)
    const password = pinToPassword(t.pin)
    const meta = { teacher_id: t.id }
    const found = byEmail.get(email)
    let authId
    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password, app_metadata: meta, email_confirm: true,
      })
      authId = found.id
      updated++
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true, app_metadata: meta,
      })
      if (error) throw new Error(`auth ${email}: ${error.message}`)
      authId = data.user.id
      created++
    }
    await supabase.from('teachers').update({ auth_id: authId }).eq('id', t.id)
  }
  console.log(`  auth kullanıcı: ${created} oluşturuldu, ${updated} güncellendi`)

  console.log('\nBitti ✓')
}

main().catch((e) => {
  console.error('HATA:', e.message)
  process.exit(1)
})
