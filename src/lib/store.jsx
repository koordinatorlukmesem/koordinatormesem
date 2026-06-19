import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import seed from '../data/seed.json'
import { buildDataset } from './buildDataset.js'
import { supabase, pinToPassword, teacherEmail } from './supabase.js'

// ---------------------------------------------------------------------------
// FAZ 1: Öğretmen giriş + okuma Supabase'den. Admin, gruplar, kontroller ve
// bildirim takibi şimdilik localStorage'da (FAZ 2'de Supabase'e taşınacak).
// ---------------------------------------------------------------------------

const DEFAULT_ADMINS = [{ id: 'sa', username: 'admin', password: 'admin123', role: 'super' }]

const ADMIN_KEY = 'mesem.session.admin'
const DATASET_KEY = 'mesem.dataset'
const PINS_KEY = 'mesem.pins'
const ADMINS_KEY = 'mesem.admins'
const LOGS_KEY = 'mesem.logs'
const IMPORTS_KEY = 'mesem.imports'
const groupsKey = (id) => `mesem.groups.${id}`
const ackKey = (id) => `mesem.ack.${id}`
const controlsKey = (id) => `mesem.controls.${id}`
const seenImportKey = (id) => `mesem.seenimport.${id}`

const AppContext = createContext(null)

const readJSON = (k, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(k))
    return v ?? fallback
  } catch {
    return fallback
  }
}

// Supabase satırlarını uygulamanın beklediği şekle çevir
const mapStudent = (s) => ({
  id: s.id, no: s.no, name: s.name, sinif: s.sinif, sube: s.sube, dal: s.dal,
  usta: s.usta, tel: s.tel, devamsizlik: s.devamsizlik, iseGiris: s.ise_giris, isNew: s.is_new,
})
const mapBusiness = (b, byBiz) => ({
  id: b.id, teacherId: b.teacher_id, name: b.name, phone: b.phone, address: b.address,
  dal: b.dal, usta: b.usta, isNew: b.is_new, students: (byBiz[b.id] || []).map(mapStudent),
})

export function AppProvider({ children }) {
  // --- admin / yerel (seed) ---
  const [dataset, setDataset] = useState(() => readJSON(DATASET_KEY, seed))
  const [pins, setPins] = useState(() => readJSON(PINS_KEY, {}))
  const [admins, setAdmins] = useState(() => readJSON(ADMINS_KEY, DEFAULT_ADMINS))
  const [adminId, setAdminId] = useState(() => localStorage.getItem(ADMIN_KEY))
  const [logs, setLogs] = useState(() => readJSON(LOGS_KEY, []))
  const [imports, setImports] = useState(() => readJSON(IMPORTS_KEY, dataset.imports || []))

  // --- öğretmen (Supabase) ---
  const [config, setConfig] = useState({ school: '', lastImportDate: null, lastImportLabel: '' })
  const [teachersList, setTeachersList] = useState([])
  const [teacherId, setTeacherId] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [terminated, setTerminated] = useState([])
  const [authReady, setAuthReady] = useState(false)

  // --- öğretmen başına yerel ---
  const [groups, setGroups] = useState([])
  const [ack, setAck] = useState([])
  const [controls, setControls] = useState({})
  const [seenImport, setSeenImport] = useState(null)

  const currentAdmin = useMemo(() => admins.find((a) => a.id === adminId) || null, [admins, adminId])
  const isAdmin = !!currentAdmin
  const isSuperAdmin = currentAdmin?.role === 'super'

  const teacher = useMemo(() => {
    const t = teachersList.find((x) => x.id === teacherId)
    return t
      ? { id: t.id, name: t.name, businessCount: t.business_count, studentCount: t.student_count }
      : null
  }, [teachersList, teacherId])

  // logged-in öğretmenin işletme/öğrenci/fesih verisini çek
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

  // başlangıç: public veriler + oturum
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
      if (tid) {
        setTeacherId(tid)
        await loadTeacherData(tid)
      }
      if (mounted) setAuthReady(true)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const tid = session?.user?.app_metadata?.teacher_id || null
      setTeacherId(tid)
      if (tid) loadTeacherData(tid)
      else {
        setBusinesses([])
        setTerminated([])
      }
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // öğretmen başına yerel veriler
  useEffect(() => {
    if (teacherId) {
      setGroups(readJSON(groupsKey(teacherId), []))
      setAck(readJSON(ackKey(teacherId), []))
      setControls(readJSON(controlsKey(teacherId), {}))
    } else {
      setGroups([])
      setAck([])
      setControls({})
      setSeenImport(null)
    }
  }, [teacherId])

  // ilk girişte mevcut liste "görülmüş" sayılır (yanlış bildirim olmasın)
  useEffect(() => {
    if (!teacherId || !config.lastImportDate) return
    let si = localStorage.getItem(seenImportKey(teacherId))
    if (si === null) {
      si = config.lastImportDate
      localStorage.setItem(seenImportKey(teacherId), si)
    }
    setSeenImport(si)
  }, [teacherId, config.lastImportDate])

  const effectivePin = (t) => pins[t.id] ?? t.pin

  const hasNewImport =
    !!teacherId && !!config.lastImportDate && seenImport !== null &&
    seenImport !== config.lastImportDate
  function markImportSeen() {
    if (!teacherId) return
    localStorage.setItem(seenImportKey(teacherId), config.lastImportDate || '')
    setSeenImport(config.lastImportDate || '')
  }

  // ---- yeni / fesih türev listeleri ----
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
      for (const s of b.students) {
        if (s.isNew && !ack.includes(s.id)) out.push({ student: s, business: b })
      }
    }
    return out
  }, [businesses, ack])

  // ---- persist yardımcıları ----
  function persistDataset(next) {
    setDataset(next)
    localStorage.setItem(DATASET_KEY, JSON.stringify(next))
  }
  function persistGroups(next) {
    setGroups(next)
    if (teacherId) localStorage.setItem(groupsKey(teacherId), JSON.stringify(next))
  }
  function persistAck(next) {
    setAck(next)
    if (teacherId) localStorage.setItem(ackKey(teacherId), JSON.stringify(next))
  }
  function persistControls(next) {
    setControls(next)
    if (teacherId) localStorage.setItem(controlsKey(teacherId), JSON.stringify(next))
  }
  function persistAdmins(next) {
    setAdmins(next)
    localStorage.setItem(ADMINS_KEY, JSON.stringify(next))
  }
  function addLog(name, role, action) {
    const cur = readJSON(LOGS_KEY, [])
    const next = [{ ts: new Date().toISOString(), name, role, action }, ...cur].slice(0, 300)
    setLogs(next)
    localStorage.setItem(LOGS_KEY, JSON.stringify(next))
  }

  function toggleControl(businessId) {
    const next = { ...controls }
    if (next[businessId]) delete next[businessId]
    else next[businessId] = new Date().toISOString()
    persistControls(next)
  }
  function resetControls() {
    persistControls({})
  }

  // ---- auth (öğretmen: Supabase) ----
  async function login(id, pin) {
    const { error } = await supabase.auth.signInWithPassword({
      email: teacherEmail(id),
      password: pinToPassword(pin),
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
    setTeacherId(null)
    setBusinesses([])
    setTerminated([])
  }

  // ---- auth (admin: yerel) ----
  function adminLogin(username, password) {
    const a = admins.find(
      (x) => x.username === String(username).trim() && x.password === String(password),
    )
    if (!a) return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' }
    localStorage.setItem(ADMIN_KEY, a.id)
    setAdminId(a.id)
    addLog(a.username, a.role === 'super' ? 'Süper Admin' : 'Admin', 'Giriş')
    return { ok: true }
  }
  function adminLogout() {
    const a = admins.find((x) => x.id === adminId)
    if (a) addLog(a.username, a.role === 'super' ? 'Süper Admin' : 'Admin', 'Çıkış')
    localStorage.removeItem(ADMIN_KEY)
    setAdminId(null)
  }
  function addAdmin(username, password) {
    if (!isSuperAdmin) return { ok: false, error: 'Yetkiniz yok.' }
    const u = String(username).trim()
    if (!u || !String(password).trim())
      return { ok: false, error: 'Kullanıcı adı ve şifre gerekli.' }
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
    persistGroups([...groups, g])
    return g
  }
  function renameGroup(id, name) {
    persistGroups(groups.map((g) => (g.id === id ? { ...g, name: name.trim() } : g)))
  }
  function deleteGroup(id) {
    persistGroups(groups.filter((g) => g.id !== id))
  }
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

  // ---- profil: şifre değiştir (Supabase Auth) ----
  async function changePin(id, oldPin, newPin) {
    if (!/^\d{4,8}$/.test(String(newPin)))
      return { ok: false, error: 'Yeni PIN 4-8 haneli sayı olmalı.' }
    const { error: e1 } = await supabase.auth.signInWithPassword({
      email: teacherEmail(id),
      password: pinToPassword(oldPin),
    })
    if (e1) return { ok: false, error: 'Mevcut PIN hatalı.' }
    const { error: e2 } = await supabase.auth.updateUser({ password: pinToPassword(newPin) })
    if (e2) return { ok: false, error: e2.message }
    return { ok: true }
  }

  // ---- admin (yerel — FAZ 2'de Supabase'e taşınacak) ----
  function setSchool(name) {
    persistDataset({ ...dataset, school: name.trim() })
  }
  function adminTeachers() {
    return dataset.teachers.map((t) => ({ ...t, pin: effectivePin(t) }))
  }
  async function importExcel(file) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
    const next = buildDataset(rows, {
      school: dataset.school,
      importDate: new Date().toISOString().slice(0, 10),
      previous: dataset,
    })
    persistDataset(next)
    const nextImports = [
      { name: file.name, date: next.lastImportDate, ts: Date.now() },
      ...imports,
    ].slice(0, 50)
    setImports(nextImports)
    localStorage.setItem(IMPORTS_KEY, JSON.stringify(nextImports))
    const newBiz = next.businesses.filter((b) => b.isNew).length
    const newStu = next.businesses.reduce(
      (n, b) => n + b.students.filter((s) => s.isNew && !b.isNew).length, 0,
    )
    return {
      teachers: next.teachers.length,
      businesses: next.businesses.length,
      students: next.businesses.reduce((n, b) => n + b.students.length, 0),
      newBiz,
      newStu,
      terminated: next.terminated.length,
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
    adminTeachers,
    importExcel,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
