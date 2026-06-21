import { useState } from 'react'
import { useApp } from '../lib/store.jsx'

export default function Profile() {
  const { teacher, school, logout, changePin, lastImportFile, lastImportLabel } = useApp()
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPin2, setNewPin2] = useState('')
  const [msg, setMsg] = useState(null)
  const [showPwd, setShowPwd] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    if (newPin !== newPin2)
      return setMsg({ type: 'err', text: 'Yeni PIN tekrarı eşleşmiyor.' })
    const res = await changePin(teacher.id, oldPin, newPin)
    if (!res.ok) return setMsg({ type: 'err', text: res.error })
    setMsg({ type: 'ok', text: 'PIN güncellendi.' })
    setOldPin('')
    setNewPin('')
    setNewPin2('')
  }

  return (
    <div>
      <header className="safe-top bg-blue-700 px-4 pb-4 pt-4 text-white shadow">
        <h1 className="text-lg font-bold">Profil</h1>
      </header>

      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-800">{teacher.name}</p>
          <p className="text-sm text-slate-500">Koordinatör Öğretmen</p>
          <p className="mt-1 text-xs text-slate-400">{school}</p>

          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 py-3 text-center">
              <div className="text-xl font-bold text-slate-800">{teacher.businessCount}</div>
              <div className="text-xs text-slate-500">İşletme</div>
            </div>
            <div className="rounded-xl bg-slate-50 py-3 text-center">
              <div className="text-xl font-bold text-slate-800">{teacher.studentCount}</div>
              <div className="text-xs text-slate-500">Öğrenci</div>
            </div>
          </div>
        </div>

        {/* Son yüklenen Excel dosyası */}
        {lastImportFile && (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a1 1 0 001 1h4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l2.5 4m0-4l-2.5 4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-400">Son Yüklenen Liste</p>
              <p className="truncate text-sm font-bold text-slate-800">{lastImportFile}</p>
              {lastImportLabel && (
                <p className="text-xs text-slate-500">{lastImportLabel} tarihli</p>
              )}
            </div>
          </div>
        )}

        {/* Şifre değiştir (akordiyon) */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <button
            onClick={() => setShowPwd((v) => !v)}
            className="flex w-full items-center gap-3 p-4 text-left active:bg-slate-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM16 11V7a4 4 0 00-8 0v4" />
              </svg>
            </div>
            <span className="flex-1 text-sm font-bold text-slate-700">Şifre Değiştir</span>
            <svg
              className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${showPwd ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {showPwd && (
            <form onSubmit={submit} className="border-t border-slate-100 p-4">
              <div className="space-y-3">
                <input
                  type="password"
                  inputMode="numeric"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Mevcut PIN"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Yeni PIN (4-8 hane)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin2}
                  onChange={(e) => setNewPin2(e.target.value)}
                  placeholder="Yeni PIN (tekrar)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
              {msg && (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {msg.text}
                </p>
              )}
              <button
                type="submit"
                className="mt-3 w-full rounded-xl bg-blue-700 py-3 font-semibold text-white active:bg-blue-800"
              >
                Şifreyi Güncelle
              </button>
            </form>
          )}
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 font-semibold text-white shadow active:bg-red-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7M13 16v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}
