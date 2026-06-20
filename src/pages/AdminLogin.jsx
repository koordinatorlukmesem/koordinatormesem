import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'

export default function AdminLogin() {
  const { adminLogin } = useApp()
  const [username, setUsername] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await adminLogin(username, pwd)
    setBusy(false)
    if (!res.ok) setError(res.error)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-lg">
          <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 11V7a4 4 0 00-8 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">Yönetici Girişi</h1>
        <p className="mt-1 text-sm text-slate-500">Excel ve okul ayarları</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Kullanıcı Adı</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="kullanıcı adı"
            autoCapitalize="none"
            className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Şifre</label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-700"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-800 py-3 font-semibold text-white shadow active:bg-slate-900 disabled:bg-slate-300"
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>

      <Link to="/login" className="mt-6 text-center text-sm font-semibold text-slate-500 active:text-slate-700">
        ← Öğretmen girişine dön
      </Link>
    </div>
  )
}
