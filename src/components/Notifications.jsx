import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'

export default function Notifications() {
  const { hasNewImport, markImportSeen, lastImportLabel, newBusinesses, newStudents } = useApp()

  const items = []
  if (hasNewImport) {
    items.push(
      <div key="import" className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-3">
        <span className="text-lg">📥</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">Yeni liste yüklendi</p>
          <p className="text-xs text-slate-500">
            Yönetici {lastImportLabel} listesini yükledi. Yeni işletme/öğrencilerini kontrol et.
          </p>
        </div>
        <button
          onClick={markImportSeen}
          className="shrink-0 rounded-full p-1 text-slate-400 active:bg-slate-200"
          aria-label="Kapat"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>,
    )
  }
  if (newBusinesses.length > 0) {
    items.push(
      <Link
        key="biz"
        to="/gruplar"
        className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 active:bg-emerald-100"
      >
        <span className="text-lg">🏢</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {newBusinesses.length} yeni işletme eklendi
          </p>
          <p className="text-xs text-slate-500">Gruplara eklemek için dokun.</p>
        </div>
        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>,
    )
  }
  if (newStudents.length > 0) {
    items.push(
      <Link
        key="stu"
        to="/gruplar"
        className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3 active:bg-sky-100"
      >
        <span className="text-lg">🎓</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {newStudents.length} yeni öğrenci eklendi
          </p>
          <p className="text-xs text-slate-500">İşletmesine göndermek için dokun.</p>
        </div>
        <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>,
    )
  }

  if (items.length === 0) return null
  return <div className="mb-3 space-y-2">{items}</div>
}
