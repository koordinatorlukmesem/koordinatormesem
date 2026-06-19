// Saf veri kurucu — Node (seed üretimi) ve tarayıcı (admin Excel yükleme) ortak kullanır.
// rows: Excel'den gelen düz nesne dizisi (RadGrid export sütun başlıkları).

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

export function trDateLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`
}

// Excel seri tarihi -> ISO (yyyy-mm-dd)
export function excelDate(serial) {
  if (serial == null || serial === '' || isNaN(serial)) return null
  const d = new Date(Math.round((Number(serial) - 25569) * 86400 * 1000))
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

const S = (v) => String(v ?? '').trim()
const bizKey = (teacherName, bizName) => `${teacherName}||${bizName}`
const studentKey = (r) => S(r['Öğr.No']) || S(r['Ad Soyad'])

export function buildDataset(rows, opts = {}) {
  const {
    school = 'Okul Adı',
    importDate = new Date().toISOString().slice(0, 10),
    previous = null,
    newWindowDays = 45,
  } = opts

  const teachersMap = new Map() // name -> teacher
  const businessMap = new Map() // teacherId|bizName -> business
  let tCount = 0
  let bCount = 0
  let sCount = 0

  for (const r of rows) {
    const tName = S(r['Öğretmen'])
    const bName = S(r['İşletme'])
    if (!tName || !bName) continue

    if (!teachersMap.has(tName)) {
      teachersMap.set(tName, { id: 't' + ++tCount, name: tName, pin: '1234' })
    }
    const teacher = teachersMap.get(tName)

    const bKey = teacher.id + '|' + bName
    if (!businessMap.has(bKey)) {
      businessMap.set(bKey, {
        id: 'b' + ++bCount,
        teacherId: teacher.id,
        teacherName: tName,
        name: bName,
        phone: S(r['İşyeri Tel']),
        address: S(r['İşyeri Adresi']),
        students: [],
        isNew: false,
      })
    }
    businessMap.get(bKey).students.push({
      id: 's' + ++sCount,
      no: S(r['Öğr.No']),
      name: S(r['Ad Soyad']),
      sinif: S(r['Sınıf']),
      sube: S(r['Şube']),
      dal: S(r['Dal']),
      usta: S(r['Usta Öğretici']),
      tel: S(r['Öğrenci Tel']),
      devamsizlik: S(r['Devamsızlık']),
      iseGiris: excelDate(r['İşe Giriş']),
      isNew: false,
    })
  }

  const businesses = [...businessMap.values()]
  for (const b of businesses) {
    b.dal = b.students[0]?.dal || ''
    b.usta = b.students[0]?.usta || ''
  }
  businesses.sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  // ---- yeni / fesih hesabı ----
  let terminated = []

  if (previous) {
    // önceki dosyayla diff
    const prevTeacherName = new Map((previous.teachers || []).map((t) => [t.id, t.name]))
    const prevBizKeys = new Set()
    const prevStudentNos = new Map() // no -> {name,businessName,teacherName,teacherId}
    const prevStudentBiz = new Set() // "no@@teacherName||bizName" (öğrencinin önceki işletmesi)
    for (const b of previous.businesses || []) {
      const tn = b.teacherName || prevTeacherName.get(b.teacherId) || ''
      prevBizKeys.add(bizKey(tn, b.name))
      for (const s of b.students) {
        const id = s.no || s.name
        prevStudentNos.set(id, {
          name: s.name, sube: s.sube, tel: s.tel, businessName: b.name, teacherName: tn,
        })
        prevStudentBiz.add(`${id}@@${bizKey(tn, b.name)}`)
      }
    }
    const curNos = new Set()
    for (const b of businesses) {
      b.isNew = !prevBizKeys.has(bizKey(b.teacherName, b.name))
      for (const s of b.students) {
        const id = s.no || s.name
        curNos.add(id)
        // öğrenci, bu işletmede yeniyse (hiç yoktu ya da başka işletmeden geçtiyse) "yeni"
        s.isNew = !prevStudentBiz.has(`${id}@@${bizKey(b.teacherName, b.name)}`)
      }
    }
    // fesih: öncede olup şimdi olmayan
    const nameToTeacherId = new Map([...teachersMap.values()].map((t) => [t.name, t.id]))
    for (const [no, info] of prevStudentNos) {
      if (!curNos.has(no)) {
        terminated.push({
          name: info.name, no: String(no), sube: info.sube, tel: info.tel,
          businessName: info.businessName,
          teacherName: info.teacherName,
          teacherId: nameToTeacherId.get(info.teacherName) || null,
          date: importDate,
        })
      }
    }
  } else {
    // önceki yok: İşe Giriş tarihine göre "yeni" sez
    let maxT = 0
    for (const b of businesses)
      for (const s of b.students) {
        if (s.iseGiris) maxT = Math.max(maxT, new Date(s.iseGiris).getTime())
      }
    const windowMs = newWindowDays * 86400 * 1000
    for (const b of businesses) {
      for (const s of b.students) {
        s.isNew = !!s.iseGiris && maxT - new Date(s.iseGiris).getTime() <= windowMs
      }
      b.isNew = b.students.length > 0 && b.students.every((s) => s.isNew)
    }
  }

  const teachers = [...teachersMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'tr'),
  )
  for (const t of teachers) {
    const tb = businesses.filter((b) => b.teacherId === t.id)
    t.businessCount = tb.length
    t.studentCount = tb.reduce((n, b) => n + b.students.length, 0)
  }

  return {
    school,
    lastImportDate: importDate,
    lastImportLabel: trDateLabel(importDate),
    teachers,
    businesses,
    terminated,
  }
}
