import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import Header from '../components/Header.jsx'
import InstallPrompt from '../components/InstallPrompt.jsx'
import Notifications from '../components/Notifications.jsx'

export default function Home() {
  const { businesses } = useApp()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr')
    if (!needle) return businesses
    return businesses.filter((b) =>
      b.name.toLocaleLowerCase('tr').includes(needle),
    )
  }, [businesses, q])

  return (
    <div>
      <Header />

      <div className="px-4 py-4">
        <InstallPrompt />
        <Notifications />

        <div className="relative mb-3">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İşletme ara..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <h2 className="mb-2 px-1 text-sm font-semibold text-slate-500">
          İşletmeler ({filtered.length})
        </h2>

        <ul className="space-y-2">
          {filtered.map((b) => (
            <li key={b.id}>
              <Link
                to={`/isletme/${b.id}`}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm active:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V9l9-6 9 6v12M3 21h18M9 21v-6h6v6" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{b.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {b.dal} • {b.students.length} öğrenci
                  </p>
                </div>
                <svg className="h-5 w-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-xl bg-white p-6 text-center text-sm text-slate-400">
              Sonuç bulunamadı.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
