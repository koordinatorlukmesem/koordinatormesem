import { useRef, useState } from 'react'
import { useApp } from '../lib/store.jsx'

export default function AdminPanel() {
  const {
    school, setSchool, adminTeachersList, importExcel, adminLogout, lastImportLabel,
    isSuperAdmin, currentAdmin, admins, logs, imports, addAdmin, deleteAdmin,
  } = useApp()
  const [name, setName] = useState(school)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' })
  const [adminMsg, setAdminMsg] = useState(null)
  const [importsOpen, setImportsOpen] = useState(false)
  const [teachersOpen, setTeachersOpen] = useState(false)
  const [teacherQ, setTeacherQ] = useState('')
  const [revealed, setRevealed] = useState(() => new Set())
  const fileRef = useRef(null)

  const teachers = adminTeachersList
  const loadedFile = imports[0]?.name || null
  const filteredTeachers = teachers.filter((t) =>
    t.name.toLocaleLowerCase('tr').includes(teacherQ.trim().toLocaleLowerCase('tr')),
  )

  function toggleReveal(id) {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function submitNewAdmin(e) {
    e.preventDefault()
    const res = await addAdmin(newAdmin.username, newAdmin.password)
    if (res.ok) {
      setNewAdmin({ username: '', password: '' })
      setAdminMsg({ type: 'ok', text: 'Admin eklendi.' })
    } else {
      setAdminMsg({ type: 'err', text: res.error })
    }
  }

  async function saveSchool() {
    await setSchool(name)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    setSummary(null)
    try {
      const res = await importExcel(file)
      setSummary(res)
    } catch (err) {
      setError('Dosya okunamadı: ' + err.message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-md bg-slate-100 pb-10">
      <header className="safe-top flex items-center justify-between bg-slate-800 px-4 py-4 text-white shadow">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Yönetici Paneli</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isSuperAdmin ? 'bg-amber-400 text-amber-900' : 'bg-blue-500 text-white'
              }`}
            >
              {isSuperAdmin ? 'Süper Admin' : 'Admin'}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {currentAdmin?.username} • Son veri: {lastImportLabel || '—'}
          </p>
        </div>
        <button
          onClick={adminLogout}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold active:bg-white/20"
        >
          Çıkış
        </button>
      </header>

      <div className="space-y-4 p-4">
        {/* Okul adı */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-slate-700">Okul Adı</h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={saveSchool}
              className="rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white active:bg-blue-800"
            >
              {saved ? '✓' : 'Kaydet'}
            </button>
          </div>
        </section>

        {/* Excel yükleme */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-700">Excel Yükle</h2>
            {loadedFile && (
              <span className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                </svg>
                <span className="max-w-[160px] truncate">{loadedFile}</span>
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Yeni işletme listesini yükleyin. Önceki veriyle karşılaştırılıp yeni
            işletme/öğrenci ve fesihler otomatik hesaplanır.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onFile}
            disabled={busy}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:font-semibold file:text-white"
          />
          {busy && <p className="mt-3 text-sm text-slate-500">İşleniyor…</p>}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {summary && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Mini value={summary.businesses} label="İşletme" />
              <Mini value={summary.students} label="Öğrenci" />
              <Mini value={summary.teachers} label="Öğretmen" />
              <Mini value={summary.newBiz} label="Yeni İşl." tone="green" />
              <Mini value={summary.newStu} label="Yeni Öğr." tone="green" />
              <Mini value={summary.terminated} label="Fesih" tone="red" />
            </div>
          )}

          {/* Önceki yüklemeler (akordiyon) */}
          {imports.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <button
                onClick={() => setImportsOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left active:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-700">
                  Önceki Yüklemeler ({imports.length})
                </span>
                <svg
                  className={`h-4 w-4 text-slate-400 transition-transform ${importsOpen ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {importsOpen && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {imports.map((im, i) => (
                    <li key={i} className="flex items-center gap-2 px-3 py-2">
                      <svg className="h-4 w-4 shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                      </svg>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{im.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(im.ts || im.date).toLocaleDateString('tr-TR')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Öğretmenler (açılır + aramalı) */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <button
            onClick={() => setTeachersOpen((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left active:bg-slate-50"
          >
            <h2 className="text-sm font-bold text-slate-700">Öğretmenler ({teachers.length})</h2>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${teachersOpen ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {teachersOpen && (
            <div className="border-t border-slate-100 p-4">
              <input
                value={teacherQ}
                onChange={(e) => setTeacherQ(e.target.value)}
                placeholder="Öğretmen ara..."
                className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <p className="mb-1 text-xs text-slate-400">Şifreyi görmek için üstüne dokunun.</p>
              <ul className="max-h-96 divide-y divide-slate-100 overflow-auto">
                {filteredTeachers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-500">
                        {t.businessCount} işletme • {t.studentCount} öğrenci
                      </p>
                    </div>
                    <button
                      onClick={() => toggleReveal(t.id)}
                      className="ml-2 shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm font-bold text-slate-700 active:bg-slate-200"
                    >
                      {revealed.has(t.id) ? t.pin : '••••'}
                    </button>
                  </li>
                ))}
                {filteredTeachers.length === 0 && (
                  <li className="py-4 text-center text-sm text-slate-400">Sonuç yok.</li>
                )}
              </ul>
            </div>
          )}
        </section>

        {/* ---- Süper admin: admin yönetimi ---- */}
        {isSuperAdmin && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-slate-700">Adminler ({admins.length})</h2>
            <ul className="mb-3 divide-y divide-slate-100">
              {admins.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.username}</p>
                    <p className="text-xs text-slate-500">
                      {a.role === 'super' ? 'Süper Admin' : 'Admin'} • Şifre: {a.password}
                    </p>
                  </div>
                  {a.role !== 'super' && (
                    <button
                      onClick={() => deleteAdmin(a.id)}
                      className="ml-2 shrink-0 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 active:bg-red-50"
                    >
                      Sil
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={submitNewAdmin} className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-600">Yeni admin ekle</p>
              <input
                value={newAdmin.username}
                onChange={(e) => setNewAdmin((s) => ({ ...s, username: e.target.value }))}
                placeholder="Kullanıcı adı"
                autoCapitalize="none"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <input
                value={newAdmin.password}
                onChange={(e) => setNewAdmin((s) => ({ ...s, password: e.target.value }))}
                placeholder="Şifre"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              {adminMsg && (
                <p className={`rounded-lg px-3 py-2 text-sm ${adminMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {adminMsg.text}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white active:bg-blue-800"
              >
                Admin Ekle
              </button>
            </form>
          </section>
        )}

        {/* ---- Süper admin: giriş/çıkış kayıtları ---- */}
        {isSuperAdmin && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-slate-700">
              Giriş / Çıkış Kayıtları ({logs.length})
            </h2>
            {logs.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">Henüz kayıt yok.</p>
            ) : (
              <ul className="max-h-80 divide-y divide-slate-100 overflow-auto">
                {logs.map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.role}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          l.action === 'Giriş' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {l.action}
                      </span>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(l.ts).toLocaleString('tr-TR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function Mini({ value, label, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <div className={`rounded-xl py-2 ${tones[tone]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] font-medium opacity-80">{label}</div>
    </div>
  )
}
