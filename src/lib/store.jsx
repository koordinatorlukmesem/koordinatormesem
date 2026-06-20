import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { buildDataset, trDateLabel } from './buildDataset.js'
import { supabase, adminSupabase, ADMIN_EMAIL, ADMIN_DB_PASS, pinToPassword, teacherEmail } from './supabase.js'

// ---------------------------------------------------------------------------
// FAZ 2: Admin işlemleri (Excel yükleme, okul adı, öğretmen listesi) Supabase'de.
// Gruplar, kontroller, ack, bildirim takibi hâlâ localStorage (FAZ 3'e).
// Admin UI kimlik doğrulama localStorage'da; Supabase işlemleri adminSupabase ile.
// ---------------------------------------------------------------------------

const DEFAULT_ADMINS = [{ id: 'sa', username: 'admin', password: 'admin123', role: 'super' }]

const ADMIN_KEY    = 'mesem.session.admin'
const ADMINS_KEY   = 'mesem.admins'
const LOGS_KEY     = 'mesem.logs'
const IMPORTS_KEY  = 'mesem.imports'
const groupsKey    = (id) => `mesem.groups.${id}`
const ackKey       = (id) => `mesem.ack.${id}`
const controlsKey  = (id) => `mesem.controls.${id}`
const seenImportKey = (id) => `mesem.seenimport.${id}`

const AppContext = createContext(null)

const readJSON = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback }
  catch { return fallback }
}

// Supabase satırları → uygulama formatı
const mapStudent = (s) => ({
  id: s.id, no: s.no, name: s.name, sinif: s.sinif, sube: s.sube, dal: s.dal,
  usta: s.usta, tel: s.tel, devamsizlik: s.devamsizlik, iseGiris: s.ise_giris, isNew: s.is_new,
})
const mapBusiness = (b, byBiz) => ({
  id: b.id, teacherId: b.teacher_id, name: b.name, phone: b.phone, address: b.address,
  dal: b.dal, usta: b.usta, isNew: b.is_new, students: (byBiz[b.id] || []).map(mapStudent),
})

// Stabil ID yardımcıları (import'lar arası tutarlı kalır, gruplar bozulmaz)
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)
}
function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function AppProvider({ children }) {
  // --- admin (UI kimlik doğrulama) ---
  const [admins, setAdmins]     = useState(() => readJSON(ADMINS_KEY, DEFAULT_ADMINS))
  const [adminId, setAdminId]   = useState(() => localStorage.getItem(ADMIN_KEY))
  const [logs, setLogs]         = useState(() => readJSON(LOGS_KEY, []))
  const [imports, setImports]   = useState(() => readJSON(IMPORTS_KEY, []))
  const [adminTeachersList, setAdminTeachersList] = useState([])

  // --- öğretmen (Supabase) ---
  const [config, setConfig]         = useState({ school: '', lastImportDate: null, lastImportLabel: '' })
  const [teachersList, setTeachersList] = useState([])
  const [teacherId, setTeacherId]   = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [terminated, setTerminated] = useState([])
  const [authReady, setAuthReady]   = useState(false)

  // --- öğretmen başına yerel ---
  const [groups, setGroups]     = useState([])
  const [ack, setAck]           = useState([])
  const [controls, setControls] = useState({})
  const [seenImport, setSeenImport] = useState(null)

  const currentAdmin  = useMemo(() => admins.find((a) => a.id === adminId) || null, [admins, adminId])
  const isAdmin       = !!currentAdmin
  const isSuperAdmin  = currentAdmin?.role === 'super'

  const teacher = useMemo(() => {
    const t = teachersList.find((x) => x.id === teacherId)
    return t
      ? { id: t.id, name: t.name, businessCount: t.business_count, studentCount: t.student_count }
      : null
  }, [teachersList, teacherId])

  // ---- admin öğretmen listesini Supabase'den yükle (PIN dahil) ----
  async function loadAdminData() {
    const [{ data: tl }, { data: sec }] = await Promise.all([
      adminSupabase.from('teachers').select('*'),
      adminSupabase.from('teacher_secrets').select('*'),
    ])
    const pinMap = {}
    for (const s of sec || []) pinMap[s.teacher_id] = s.pin
    setAdminTeachersList(
      (tl || [])
        .map((t) => ({
          ...t,
          businessCount: t.business_count,
          studentCount: t.student_count,
          pin: pinMap[t.id] || '????',
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    )
  }

  // ---- adminSupabase oturumunu sağla (varsa kullan, yoksa yenile) ----
  async function ensureAdminSession() {
    const { data: { session } } = await adminSupabase.auth.getSession()
    if (session?.user?.app_metadata?.role === 'admin') return true
    const { error } = await adminSupabase.auth.signInWithPassword({
      email: ADMIN_EMAIL, password: ADMIN_DB_PASS,
    })
    return !error
  }

  // ---- öğretmenin işletme/öğrenci/fesih verilerini yükle ----
  async function loadTeacherData(tid) {
    const [biz, stu, term] = await Promise.all([
      supabase.from('businesses').select('*').eq('teacher_id', tid),
      supabase.from('students').select('*').eq('teacher_id', tid),
      supabase.from('terminated').select('*').eq('teacher_id', tid),
    ])
    const byBiz = {}
    for (const s of stu.data || []) (byBiz[s.business_id] ||= []).push(s)
    const list = (biz.data || []).map((b) => mapBusiness(b, byBiz))
    list.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    setBusinesses(list)
    setTerminated(
      (term.data || []).map((t) => ({
        teacherId: t.teacher_id, name: t.name, no: t.no, sube: t.sube,
        tel: t.tel, businessName: t.business_name, date: t.date,
      })),
    )
  }

  // ---- başlangıç: public veriler + öğretmen oturumu ----
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [cfg, tl] = await Promise.all([
        supabase.from('app_config').select('*').eq('id', 1).maybeSingle(),
        supabase.from('teachers').select('*'),
      ])
      if (!mounted) return
      if (cfg.data)
        setConfig({
          school: cfg.data.school,
          lastImportDate: cfg.data.last_import_date,
          lastImportLabel: cfg.data.last_import_label,
        })
      if (tl.data) {
        const sorted = [...tl.data].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
        setTeachersList(sorted)
      }
      const { data: { session } } = await supabase.auth.getSession()
      const tid = session?.user?.app_metadata?.teacher_id || null
      if (tid) { setTeacherId(tid); await loadTeacherData(tid) }
      if (mounted) setAuthReady(true)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const tid = session?.user?.app_metadata?.teacher_id || null
      setTeacherId(tid)
      if (tid) loadTeacherData(tid)
      else { setBusinesses([]); setTerminated([]) }
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  // ---- admin oturumu restore: localStorage'da adminId varsa Supabase oturumunu sağla ----
  useEffect(() => {
    if (!adminId) { setAdminTeachersList([]); return }
    ensureAdminSession().then((ok) => { if (ok) loadAdminData() })
  }, [adminId])

  // ---- öğretmen başına yerel veriler ----
  useEffect(() => {
    if (teacherId) {
      setGroups(readJSON(groupsKey(teacherId), []))
      setAck(readJSON(ackKey(teacherId), []))
      setControls(readJSON(controlsKey(teacherId), {}))
    } else {
      setGroups([]); setAck([]); setControls({}); setSeenImport(null)
    }
  }, [teacherId])

  // ---- seenImport başlangıç (yanlış bildirim önleme) ----
  useEffect(() => {
    if (!teacherId || !config.lastImportDate) return
    let si = localStorage.getItem(seenImportKey(teacherId))
    if (si === null) {
      si = config.lastImportDate
      localStorage.setItem(seenImportKey(teacherId), si)
    }
    setSeenImport(si)
  }, [teacherId, config.lastImportDate])

  const hasNewImport =
    !!teacherId && !!config.lastImportDate && seenImport !== null &&
    seenImport !== config.lastImportDate
  function markImportSeen() {
    if (!teacherId) return
    localStorage.setItem(seenImportKey(teacherId), config.lastImportDate || '')
    setSeenImport(config.lastImportDate || '')
  }

  // ---- türev listeler ----
  const groupedBusinessIds = useMemo(() => new Set(groups.flatMap((g) => g.businessIds)), [groups])
  const newBusinesses = useMemo(
    () => businesses.filter((b) => b.isNew && !groupedBusinessIds.has(b.id)),
    [businesses, groupedBusinessIds],
  )
  const ungroupedBusinesses = useMemo(
    () => businesses.filter((b) => !groupedBusinessIds.has(b.id)),
    [businesses, groupedBusinessIds],
  )
  const newStudents = useMemo(() => {
    const out = []
    for (const b of businesses) {
      if (b.isNew) continue
      for (const s of b.students)
        if (s.isNew && !ack.includes(s.id)) out.push({ student: s, business: b })
    }
    return out
  }, [businesses, ack])

  // ---- persist yardımcıları ----
  function persistGroups(next)   { setGroups(next); if (teacherId) localStorage.setItem(groupsKey(teacherId), JSON.stringify(next)) }
  function persistAck(next)      { setAck(next);    if (teacherId) localStorage.setItem(ackKey(teacherId), JSON.stringify(next)) }
  function persistControls(next) { setControls(next); if (teacherId) localStorage.setItem(controlsKey(teacherId), JSON.stringify(next)) }
  function persistAdmins(next)   { setAdmins(next); localStorage.setItem(ADMINS_KEY, JSON.stringify(next)) }
  function addLog(name, role, action) {
    const cur = readJSON(LOGS_KEY, [])
    const next = [{ ts: new Date().toISOString(), name, role, action }, ...cur].slice(0, 300)
    setLogs(next); localStorage.setItem(LOGS_KEY, JSON.stringify(next))
  }

  function toggleControl(businessId) {
    const next = { ...controls }
    if (next[businessId]) delete next[businessId]
    else next[businessId] = new Date().toISOString()
    persistControls(next)
  }
  function resetControls() { persistControls({}) }

  // ---- auth: öğretmen (Supabase) ----
  async function login(id, pin) {
    const { error } = await supabase.auth.signInWithPassword({
      email: teacherEmail(id), password: pinToPassword(pin),
    })
    if (error) return { ok: false, error: 'PIN hatalı.' }
    setTeacherId(id)
    await loadTeacherData(id)
    const t = teachersList.find((x) => x.id === id)
    addLog(t?.name || id, 'Öğretmen', 'Giriş')
    return { ok: true }
  }
  async function logout() {
    const t = teachersList.find((x) => x.id === teacherId)
    if (t) addLog(t.name, 'Öğretmen', 'Çıkış')
    await supabase.auth.signOut()
    setTeacherId(null); setBusinesses([]); setTerminated([])
  }

  // ---- auth: admin (localStorage + adminSupabase) ----
  async function adminLogin(username, password) {
    const a = admins.find(
      (x) => x.username === String(username).trim() && x.password === String(password),
    )
    if (!a) return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' }
    const ok = await ensureAdminSession()
    if (!ok) return { ok: false, error: 'Veritabanı bağlantısı kurulamadı. create-admin.mjs çalıştırıldı mı?' }
    localStorage.setItem(ADMIN_KEY, a.id)
    setAdminId(a.id)
    addLog(a.username, a.role === 'super' ? 'Süper Admin' : 'Admin', 'Giriş')
    await loadAdminData()
    return { ok: true }
  }
  async function adminLogout() {
    const a = admins.find((x) => x.id === adminId)
    if (a) addLog(a.username, a.role === 'super' ? 'Süper Admin' : 'Admin', 'Çıkış')
    await adminSupabase.auth.signOut()
    localStorage.removeItem(ADMIN_KEY)
    setAdminId(null)
    setAdminTeachersList([])
  }
  function addAdmin(username, password) {
    if (!isSuperAdmin) return { ok: false, error: 'Yetkiniz yok.' }
    const u = String(username).trim()
    if (!u || !String(password).trim()) return { ok: false, error: 'Kullanıcı adı ve şifre gerekli.' }
    if (admins.some((a) => a.username.toLocaleLowerCase('tr') === u.toLocaleLowerCase('tr')))
      return { ok: false, error: 'Bu kullanıcı adı zaten var.' }
    persistAdmins([...admins, { id: 'ad' + Date.now(), username: u, password: String(password), role: 'admin' }])
    return { ok: true }
  }
  function deleteAdmin(id) {
    if (!isSuperAdmin) return
    const a = admins.find((x) => x.id === id)
    if (!a || a.role === 'super') return
    persistAdmins(admins.filter((x) => x.id !== id))
  }

  // ---- selectors ----
  const getBusiness = (id) => businesses.find((b) => b.id === id) || null

  // ---- gruplar ----
  function createGroup(name) {
    const g = { id: 'g' + Date.now(), name: name.trim(), businessIds: [] }
    persistGroups([...groups, g]); return g
  }
  function renameGroup(id, name) {
    persistGroups(groups.map((g) => (g.id === id ? { ...g, name: name.trim() } : g)))
  }
  function deleteGroup(id)  { persistGroups(groups.filter((g) => g.id !== id)) }
  function setGroupBusinesses(id, businessIds) {
    persistGroups(groups.map((g) => (g.id === id ? { ...g, businessIds } : g)))
  }
  function addBusinessToGroup(groupId, businessId) {
    persistGroups(
      groups.map((g) =>
        g.id === groupId && !g.businessIds.includes(businessId)
          ? { ...g, businessIds: [...g.businessIds, businessId] }
          : g,
      ),
    )
  }
  function acknowledgeStudent(studentId) {
    if (!ack.includes(studentId)) persistAck([...ack, studentId])
  }

  // ---- PIN değiştir (Supabase Auth + teacher_secrets) ----
  async function changePin(id, oldPin, newPin) {
    if (!/^\d{4,8}$/.test(String(newPin)))
      return { ok: false, error: 'Yeni PIN 4-8 haneli sayı olmalı.' }
    const { error: e1 } = await supabase.auth.signInWithPassword({
      email: teacherEmail(id), password: pinToPassword(oldPin),
    })
    if (e1) return { ok: false, error: 'Mevcut PIN hatalı.' }
    const { error: e2 } = await supabase.auth.updateUser({ password: pinToPassword(newPin) })
    if (e2) return { ok: false, error: e2.message }
    // teacher_secrets'i de güncelle (PIN görüntüleme için)
    await supabase.from('teacher_secrets').update({ pin: String(newPin) }).eq('teacher_id', id)
    return { ok: true }
  }

  // ---- admin: okul adı (Supabase) ----
  async function setSchool(name) {
    const trimmed = name.trim()
    await adminSupabase.from('app_config').update({ school: trimmed }).eq('id', 1)
    setConfig((c) => ({ ...c, school: trimmed }))
  }

  // ---- admin: Excel import → Supabase ----
  async function importExcel(file) {
    // 1. Mevcut Supabase verisini "previous" olarak çek (diff için)
    const [{ data: curBizes, error: e1 }, { data: curStus, error: e2 }] = await Promise.all([
      adminSupabase.from('businesses').select('id, teacher_id, name'),
      adminSupabase.from('students').select('business_id, no, name, sube, tel'),
    ])
    if (e1 || e2) throw new Error('Mevcut veri okunamadı: ' + (e1?.message || e2?.message))

    const curStuByBiz = {}
    for (const s of curStus || []) (curStuByBiz[s.business_id] ||= []).push(s)
    const previous = {
      teachers: teachersList.map((t) => ({ id: t.id, name: t.name })),
      businesses: (curBizes || []).map((b) => {
        const t = teachersList.find((x) => x.id === b.teacher_id)
        return {
          teacherName: t?.name || b.teacher_id,
          teacherId: b.teacher_id,
          name: b.name,
          students: (curStuByBiz[b.id] || []).map((s) => ({
            no: s.no, name: s.name, sube: s.sube, tel: s.tel,
          })),
        }
      }),
    }

    // 2. Excel'i parse et
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
    const importDate = new Date().toISOString().slice(0, 10)
    const next = buildDataset(rows, {
      school: config.school,
      importDate,
      previous: previous.businesses.length > 0 ? previous : null,
    })

    // 3. Stabil ID'li işletme satırları hazırla
    const bizRows = []
    const bizIdMap = {} // "teacherId|bizName" -> stableId
    for (const b of next.businesses) {
      const t = teachersList.find((x) => x.name === b.teacherName)
      if (!t) continue
      const sid = `${t.id}_${slugify(b.name)}`
      bizIdMap[`${t.id}|${b.name}`] = sid
      bizRows.push({
        id: sid, teacher_id: t.id, name: b.name,
        phone: b.phone || '', address: b.address || '',
        dal: b.dal || '', usta: b.usta || '', is_new: b.isNew || false,
      })
    }

    // 4. Öğrenci satırları hazırla
    const stuRows = []
    for (const b of next.businesses) {
      const t = teachersList.find((x) => x.name === b.teacherName)
      if (!t) continue
      const bizId = bizIdMap[`${t.id}|${b.name}`]
      if (!bizId) continue
      for (const s of b.students) {
        stuRows.push({
          id: `${bizId}_${slugify(s.no || s.name)}`,
          business_id: bizId, teacher_id: t.id,
          no: s.no || '', name: s.name || '', sinif: s.sinif || '',
          sube: s.sube || '', dal: s.dal || '', usta: s.usta || '',
          tel: s.tel || '', devamsizlik: s.devamsizlik || '',
          ise_giris: s.iseGiris || null, is_new: s.isNew || false,
        })
      }
    }

    // 5. Fesih satırları hazırla
    const termRows = (next.terminated || [])
      .map((t) => ({
        teacher_id: teachersList.find((x) => x.name === t.teacherName)?.id || t.teacherId || null,
        name: t.name || '', no: t.no || '', sube: t.sube || '',
        tel: t.tel || '', business_name: t.businessName || '', date: t.date || importDate,
      }))
      .filter((r) => r.teacher_id)

    // 6. Eski veriyi sil (businesses cascade → students; terminated ayrı)
    const [{ error: delBizErr }, { error: delTermErr }] = await Promise.all([
      adminSupabase.from('businesses').delete().not('id', 'is', null),
      adminSupabase.from('terminated').delete().not('id', 'is', null),
    ])
    if (delBizErr) throw new Error('İşletmeler silinemedi: ' + delBizErr.message)
    if (delTermErr) console.warn('Fesih silme hatası:', delTermErr.message)

    // 7. Yeni işletmeleri toplu ekle (chunk: 400)
    for (const ch of chunk(bizRows, 400)) {
      const { error } = await adminSupabase.from('businesses').insert(ch)
      if (error) throw new Error('İşletme yazılamadı: ' + error.message)
    }

    // 8. Yeni öğrencileri toplu ekle (chunk: 400)
    for (const ch of chunk(stuRows, 400)) {
      const { error } = await adminSupabase.from('students').insert(ch)
      if (error) throw new Error('Öğrenci yazılamadı: ' + error.message)
    }

    // 9. Fesihleri ekle
    if (termRows.length > 0) {
      const { error } = await adminSupabase.from('terminated').insert(termRows)
      if (error) console.warn('Fesih yazma hatası:', error.message)
    }

    // 10. Öğretmen sayılarını toplu güncelle
    const teacherUpserts = next.teachers
      .map((t) => {
        const tr = teachersList.find((x) => x.name === t.name)
        return tr
          ? { id: tr.id, name: tr.name, business_count: t.businessCount, student_count: t.studentCount }
          : null
      })
      .filter(Boolean)
    if (teacherUpserts.length > 0) {
      await adminSupabase.from('teachers').upsert(teacherUpserts, { onConflict: 'id' })
      setTeachersList((prev) =>
        prev.map((t) => {
          const u = teacherUpserts.find((x) => x.id === t.id)
          return u ? { ...t, business_count: u.business_count, student_count: u.student_count } : t
        }),
      )
    }

    // 11. app_config güncelle
    const label = trDateLabel(importDate)
    await adminSupabase.from('app_config').update({
      last_import_date: importDate,
      last_import_label: label,
    }).eq('id', 1)
    setConfig((c) => ({ ...c, lastImportDate: importDate, lastImportLabel: label }))

    // 12. Import geçmişini localStorage'a yaz
    const nextImports = [{ name: file.name, date: importDate, ts: Date.now() }, ...imports].slice(0, 50)
    setImports(nextImports)
    localStorage.setItem(IMPORTS_KEY, JSON.stringify(nextImports))

    // 13. Giriş yapmış öğretmenin verilerini yenile
    if (teacherId) await loadTeacherData(teacherId)

    return {
      teachers: next.teachers.length,
      businesses: bizRows.length,
      students: stuRows.length,
      newBiz:  bizRows.filter((b) => b.is_new).length,
      newStu:  stuRows.filter((s) => s.is_new).length,
      terminated: termRows.length,
    }
  }

  const value = {
    authReady,
    school: config.school,
    lastImportLabel: config.lastImportLabel,
    teachers: teachersList,
    teacher,
    businesses,
    terminated,
    groups,
    newBusinesses,
    ungroupedBusinesses,
    newStudents,
    hasNewImport,
    markImportSeen,
    controls,
    toggleControl,
    resetControls,
    isAdmin,
    isSuperAdmin,
    currentAdmin,
    admins,
    logs,
    imports,
    adminTeachersList,
    login,
    logout,
    adminLogin,
    adminLogout,
    addAdmin,
    deleteAdmin,
    getBusiness,
    createGroup,
    renameGroup,
    deleteGroup,
    setGroupBusinesses,
    addBusinessToGroup,
    acknowledgeStudent,
    changePin,
    setSchool,
    importExcel,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
