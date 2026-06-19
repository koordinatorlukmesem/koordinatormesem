import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'

export default function Login() {
  const { school, teachers, login } = useApp()
  const [teacherId, setTeacherId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!teacherId) return setError('Lütfen adınızı seçin.')
    setBusy(true)
    const res = await login(teacherId, pin)
    setBusy(false)
    if (!res.ok) setError(res.error)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg">
          <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V8l9-5 9 5v13M9 21v-6h6v6" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">İşletme Takip Sistemi</h1>
        <p className="mt-1 text-sm text-slate-500">{school}</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Koordinatör Öğretmen
          </label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="">Adınızı seçin...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="w-full rounded-xl border border-slate-300 px-3 py-3 tracking-widest outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white shadow active:bg-blue-800 disabled:bg-slate-300"
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        <p className="text-center text-xs text-slate-400">Demo PIN: 1234</p>
      </form>

      <Link
        to="/admin/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 active:text-slate-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 11V7a4 4 0 00-8 0v4" />
        </svg>
        Yönetici Girişi
      </Link>
    </div>
  )
}
