import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import PageHeader from '../components/PageHeader.jsx'

// numarayı normalize et: rakamları al, başında 0 yoksa ekle
function fmtPhone(p) {
  const d = String(p || '').replace(/\D/g, '')
  if (!d) return ''
  return d.startsWith('0') ? d : '0' + d
}

// "Okul : 4.5, İşletme :0" -> { okul: 4.5, isletme: 0, critical }
function parseAbsence(text) {
  const m = String(text || '').match(/Okul\s*:\s*([\d.,]+).*İşletme\s*:\s*([\d.,]+)/i)
  if (!m) return { okul: null, isletme: null, critical: false }
  const okul = parseFloat(m[1].replace(',', '.'))
  const isletme = parseFloat(m[2].replace(',', '.'))
  return { okul, isletme, critical: okul >= 5.5 || isletme >= 25 }
}

function StudentInfo({ s }) {
  const ab = parseAbsence(s.devamsizlik)
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{s.name}</p>
        {s.tel && (
          <a
            href={`tel:${fmtPhone(s.tel)}`}
            className="flex shrink-0 items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white active:bg-green-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1 3a1 1 0 01-.27 1.05l-1.4 1.4a14 14 0 006 6l1.4-1.4a1 1 0 011.05-.27l3 1a1 1 0 01.68.95V19a2 2 0 01-2 2A16 16 0 013 5z" />
            </svg>
            {fmtPhone(s.tel)}
          </a>
        )}
      </div>
      <p className="mt-0.5 text-xs text-slate-600">
        Şube: {s.sube || '—'} | No: {s.no || '—'}
      </p>
      <p className="text-xs text-slate-600">Devamsızlık: {s.devamsizlik || '—'}</p>
      {ab.critical && (
        <p className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-extrabold tracking-wide text-red-600">
          KRİTİK!
        </p>
      )}
    </div>
  )
}

export default function BusinessDetail() {
  const { id } = useParams()
  const { getBusiness } = useApp()
  const business = getBusiness(id)
  const [studentId, setStudentId] = useState('')
  const [showAll, setShowAll] = useState(false)

  if (!business) {
    return (
      <div>
        <PageHeader title="İşletme" />
        <p className="p-6 text-center text-slate-500">İşletme bulunamadı.</p>
      </div>
    )
  }

  const selected = business.students.find((s) => s.id === studentId)
  const dal = selected?.dal || business.dal
  const usta = selected?.usta || business.usta
  const mapsQuery = encodeURIComponent(business.address || business.name)

  return (
    <div>
      <PageHeader title={business.name} />

      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {/* İşletme adı */}
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-400">İşletme Adı</p>
            <p className="text-base font-bold text-slate-800">{business.name}</p>
          </div>

          {/* Usta Öğretici */}
          <div className="mb-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2">
            <span className="text-sm font-semibold text-amber-800">Usta Öğretici: </span>
            <span className="text-sm text-amber-900">{usta || '—'}</span>
          </div>

          {/* Dal */}
          <div className="mb-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 px-3 py-2">
            <span className="text-sm font-semibold text-blue-800">Dal: </span>
            <span className="text-sm text-blue-900">{dal || '—'}</span>
          </div>

          {/* Çalışan Öğrenciler */}
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Çalışan Öğrenciler ({business.students.length})
            </p>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 active:bg-blue-50"
            >
              {showAll ? 'GİZLE' : 'TÜMÜ'}
            </button>
          </div>

          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Öğrenci Seçin...</option>
            {business.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.dal})
              </option>
            ))}
          </select>

          {showAll && (
            <ul className="mt-3 space-y-2">
              {business.students.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <StudentInfo s={s} />
                </li>
              ))}
            </ul>
          )}

          {selected && !showAll && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
              <StudentInfo s={selected} />
            </div>
          )}
        </div>

        {/* Adres */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Adres</p>
          <p className="mb-3 text-sm text-slate-700">{business.address || '—'}</p>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700"
            >
              📍 Yol Tarifi
            </a>
            <a
              href={business.phone ? `tel:${fmtPhone(business.phone)}` : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white ${
                business.phone ? 'bg-green-600 active:bg-green-700' : 'bg-slate-300'
              }`}
            >
              📞 İşletmeyi Ara
            </a>
          </div>
        </div>

        {/* Konum / harita */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-xs font-medium text-slate-400">Konum</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-600"
            >
              Haritalar'da aç ↗
            </a>
          </div>
          <iframe
            title="harita"
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
          />
        </div>
      </div>
    </div>
  )
}
