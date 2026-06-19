// Excel -> src/data/seed.json üretir.
// Demo için: her öğretmene PIN "1234"; birkaç öğrenciyi "fesih" olarak ayırır.
// Hassas alanlar (TC) dahil edilmez.
import XLSX from 'xlsx'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDataset } from '../src/lib/buildDataset.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC_XLSX = process.argv[2] ||
  'C:/Users/mdemirel/Desktop/son işletme bilgileri/17-HAZİRAN GÜNCEL İŞLETMELER.xlsx'
const OUT = resolve(__dirname, '../src/data/seed.json')

const SCHOOL_NAME = 'Selçuklu Mesleki Eğitim Merkezi' // admin değiştirebilir
const IMPORT_DATE = '2026-06-17'

const wb = XLSX.readFile(SRC_XLSX)
const ws = wb.Sheets[wb.SheetNames[0]]
const allRows = XLSX.utils.sheet_to_json(ws, { defval: '' })

// --- demo amaçlı birkaç öğrenciyi "fesih" olarak ayır (aktif veriden çıkar) ---
const terminatedRows = []
const activeRows = []
allRows.forEach((r, i) => {
  if (i % 131 === 0 && terminatedRows.length < 18 && String(r['İşletme']).trim()) {
    terminatedRows.push(r)
  } else {
    activeRows.push(r)
  }
})

const dataset = buildDataset(activeRows, {
  school: SCHOOL_NAME,
  importDate: IMPORT_DATE,
})

// fesih kayıtlarını öğretmen id'siyle eşleştir
const nameToId = new Map(dataset.teachers.map((t) => [t.name, t.id]))
dataset.terminated = terminatedRows
  .map((r) => ({
    name: String(r['Ad Soyad']).trim(),
    no: String(r['Öğr.No']).trim(),
    sube: String(r['Şube']).trim(),
    tel: String(r['Öğrenci Tel']).trim(),
    businessName: String(r['İşletme']).trim(),
    teacherName: String(r['Öğretmen']).trim(),
    teacherId: nameToId.get(String(r['Öğretmen']).trim()) || null,
    date: IMPORT_DATE,
  }))
  .filter((t) => t.teacherId)

// başlangıç yükleme geçmişi (kaynak dosya)
dataset.imports = [{ name: basename(SRC_XLSX), date: IMPORT_DATE, ts: Date.parse(IMPORT_DATE) }]

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(dataset), 'utf8')

const newBiz = dataset.businesses.filter((b) => b.isNew).length
const newStu = dataset.businesses.reduce(
  (n, b) => n + b.students.filter((s) => s.isNew && !b.isNew).length, 0,
)
console.log(
  `seed.json: ${dataset.teachers.length} öğretmen, ${dataset.businesses.length} işletme, ` +
    `${dataset.businesses.reduce((n, b) => n + b.students.length, 0)} öğrenci\n` +
    `  yeni işletme: ${newBiz}, yeni öğrenci: ${newStu}, fesih: ${dataset.terminated.length}`,
)
