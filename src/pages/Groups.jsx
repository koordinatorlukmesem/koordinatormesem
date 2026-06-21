import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import SwipeRow from '../components/SwipeRow.jsx'

// numarayı normalize et: başında 0 yoksa ekle
function fmtPhone(p) {
  const d = String(p || '').replace(/\D/g, '')
  if (!d) return ''
  return d.startsWith('0') ? d : '0' + d
}

export default function Groups() {
  const {
    groups,
    createGroup,
    renameGroup,
    deleteGroup,
    newBusinesses,
    ungroupedBusinesses,
    newStudents,
    terminated,
    lostBusinesses,
    lastImportLabel,
    addBusinessToGroup,
    acknowledgeStudent,
    controls,
    resetControls,
  } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(null) // hangi özel kart açık
  const [pickerBiz, setPickerBiz] = useState(null) // gruba eklenecek işletme id
  const [showReset, setShowReset] = useState(false)

  // grubun tüm işletmeleri kontrol edildi mi?
  const isGroupAllControlled = (g) =>
    g.businessIds.length > 0 && g.businessIds.every((id) => controls[id])

  function add(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    createGroup(n)
    setName('')
  }
  function toggle(k) {
    setOpen((o) => (o === k ? null : k))
    setPickerBiz(null)
  }

  // bir işletmeyi bir gruba ekleme satırı (Yeni/Eklenmemiş kartlarında ortak)
  function BizAddRow({ b }) {
    return (
      <li className="rounded-lg bg-slate-50 p-2.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{b.name}</p>
            <p className="truncate text-xs text-slate-500">
              {b.dal} • {b.students.length} öğrenci
            </p>
          </div>
          <button
            onClick={() => setPickerBiz(pickerBiz === b.id ? null : b.id)}
            className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white active:bg-blue-700"
          >
            Gruba Ekle
          </button>
        </div>
        {pickerBiz === b.id && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {groups.length === 0 ? (
              <span className="text-xs text-slate-400">Önce aşağıdan grup oluşturun.</span>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    addBusinessToGroup(g.id, b.id)
                    setPickerBiz(null)
                  }}
                  className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-700 active:bg-blue-50"
                >
                  {g.name}
                </button>
              ))
            )}
          </div>
        )}
      </li>
    )
  }

  return (
    <div>
      <header className="safe-top rounded-b-3xl bg-gradient-to-br from-indigo-600 to-blue-600 px-4 pb-5 pt-5 text-white shadow-lg">
        <h1 className="text-lg font-bold">Gruplar</h1>
        <p className="text-sm text-blue-100">İşletmelerinizi gruplara ayırın</p>
      </header>

      <div className="space-y-3 p-4">
        {/* ---- Özel (sabit) gruplar ---- */}
        {/* Gruba Eklenmeyen İşletme */}
        <SpecialCard
          open={open === 'ungrouped'}
          onToggle={() => toggle('ungrouped')}
          color="amber"
          icon="📋"
          title="Gruba Eklenmeyen İşletme"
          count={ungroupedBusinesses.length}
        >
          {ungroupedBusinesses.length === 0 ? (
            <Empty text="Tüm işletmeler bir gruba eklenmiş." />
          ) : (
            <ul className="space-y-2">
              {ungroupedBusinesses.map((b) => (
                <BizAddRow key={b.id} b={b} />
              ))}
            </ul>
          )}
        </SpecialCard>

        {/* Yeni Eklenen İşletme */}
        <SpecialCard
          open={open === 'biz'}
          onToggle={() => toggle('biz')}
          color="emerald"
          icon="🏢"
          title="Yeni Eklenen İşletme"
          count={newBusinesses.length}
        >
          {newBusinesses.length === 0 ? (
            <Empty text="Gruplara eklenmemiş yeni işletme yok." />
          ) : (
            <ul className="space-y-2">
              {newBusinesses.map((b) => (
                <BizAddRow key={b.id} b={b} />
              ))}
            </ul>
          )}
        </SpecialCard>

        {/* Yeni Eklenen Öğrenci */}
        <SpecialCard
          open={open === 'stu'}
          onToggle={() => toggle('stu')}
          color="sky"
          icon="🎓"
          title="Yeni Eklenen Öğrenci"
          count={newStudents.length}
        >
          {newStudents.length === 0 ? (
            <Empty text="Yeni eklenen öğrenci yok." />
          ) : (
            <ul className="space-y-2">
              {newStudents.map(({ student, business }) => (
                <li key={student.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{student.name}</p>
                    <p className="truncate text-xs text-slate-500">{business.name}</p>
                  </div>
                  <button
                    onClick={() => acknowledgeStudent(student.id)}
                    className="shrink-0 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white active:bg-sky-700"
                  >
                    İşletmesine Gönder
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SpecialCard>

        {/* ---- Kullanıcı grupları ---- */}
        {groups.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-400">
            Henüz grup yok. En alttan yeni bir grup oluşturun.
          </div>
        ) : (
          <ul className="space-y-2 pt-1">
            <p className="px-1 text-xs text-slate-400">İpucu: bir grubu düzenlemek için sola kaydırın.</p>
            {groups.map((g) => {
              const allCtrl = isGroupAllControlled(g)
              return (
              <li key={g.id}>
                <SwipeRow
                  actions={[
                    {
                      label: 'Değiştir',
                      className: 'bg-amber-500',
                      onClick: () => {
                        const n = window.prompt('Grup adı', g.name)
                        if (n && n.trim()) renameGroup(g.id, n)
                      },
                    },
                    {
                      label: 'Sil',
                      className: 'bg-red-600',
                      onClick: () => {
                        if (window.confirm(`"${g.name}" grubu silinsin mi?`)) deleteGroup(g.id)
                      },
                    },
                  ]}
                >
                  <button
                    onClick={() => navigate(`/gruplar/${g.id}`)}
                    className={`flex w-full items-center gap-3 p-3 text-left ${
                      allCtrl ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="8" height="8" rx="2" />
                        <rect x="13" y="3" width="8" height="8" rx="2" />
                        <rect x="3" y="13" width="8" height="8" rx="2" />
                        <rect x="13" y="13" width="8" height="8" rx="2" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{g.name}</p>
                      <p className="text-xs text-slate-500">{g.businessIds.length} işletme</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </SwipeRow>
              </li>
            )})}
          </ul>
        )}

        {/* ---- Yeni grup oluştur (en altta) ---- */}
        <form onSubmit={add} className="flex gap-2 pt-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yeni grup adı (örn. 1. Grup)"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-700 px-4 font-semibold text-white active:bg-blue-800"
          >
            Ekle
          </button>
        </form>

        {/* ---- Tüm kontrolleri sıfırla ---- */}
        <button
          onClick={() => setShowReset(true)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 active:bg-red-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.9-2M4 16a8 8 0 0014.9 2" />
          </svg>
          Tüm Kontrolleri Sıfırla
        </button>

        {/* ---- Fesih Yapılan Öğrenciler (en altta) ---- */}
        <SpecialCard
          open={open === 'fesih'}
          onToggle={() => toggle('fesih')}
          color="rose"
          icon="⚠️"
          title="Fesih Yapılan Öğrenciler"
          count={terminated.length}
        >
          {terminated.length === 0 ? (
            <Empty text="Fesih kaydı yok." />
          ) : (
            <>
              <p className="mb-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                {lastImportLabel} öncesi fesih yapılmış.
              </p>
              <ul className="space-y-2">
                {terminated.map((t, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{t.name}</p>
                      {t.tel && (
                        <a
                          href={`tel:${fmtPhone(t.tel)}`}
                          className="flex shrink-0 items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white active:bg-green-700"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1 3a1 1 0 01-.27 1.05l-1.4 1.4a14 14 0 006 6l1.4-1.4a1 1 0 011.05-.27l3 1a1 1 0 01.68.95V19a2 2 0 01-2 2A16 16 0 013 5z" />
                          </svg>
                          {fmtPhone(t.tel)}
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Şube: {t.sube || '—'} • No: {t.no || '—'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{t.businessName}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SpecialCard>

        {/* ---- Çırağı Kalmayan İşletmeler (en altta) ---- */}
        <SpecialCard
          open={open === 'lost'}
          onToggle={() => toggle('lost')}
          color="slate"
          icon="🏚️"
          title="Çırağı Kalmayan İşletmeler"
          count={lostBusinesses.length}
        >
          {lostBusinesses.length === 0 ? (
            <Empty text="Listeden düşen işletme yok." />
          ) : (
            <>
              <p className="mb-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Yeni listede yer almadığı için gruplarınızdan çıkarıldı.
              </p>
              <ul className="space-y-2">
                {lostBusinesses.map((b) => (
                  <li key={b.id} className="rounded-lg bg-slate-50 p-2.5">
                    <p className="truncate text-sm font-semibold text-slate-800">{b.name}</p>
                    {b.dal && <p className="truncate text-xs text-slate-500">{b.dal}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </SpecialCard>
      </div>

      {/* Onay modalı */}
      {showReset && (
        <div
          className="fixed inset-0 z-50 mx-auto flex max-w-md items-center justify-center bg-black/50 px-6"
          onClick={() => setShowReset(false)}
        >
          <div
            className="w-full rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.86l-8 14A1 1 0 003.17 19h17.66a1 1 0 00.87-1.5l-8-14a1 1 0 00-1.74 0z" />
              </svg>
            </div>
            <h3 className="text-center text-base font-bold text-slate-800">Tüm Kontroller Sıfırlansın mı?</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Tüm işletmelerin "Kontrol Edildi" işaretleri ve tarihleri silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 active:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  resetControls()
                  setShowReset(false)
                }}
                className="rounded-xl bg-red-600 py-3 font-semibold text-white active:bg-red-700"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const COLORS = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  slate: 'border-slate-300 bg-slate-100 text-slate-700',
}

function SpecialCard({ open, onToggle, color, icon, title, count, children }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left active:bg-slate-50"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg ${COLORS[color]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{count} kayıt</p>
        </div>
        <span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-bold ${COLORS[color]}`}>
          {count}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && <div className="border-t border-slate-100 p-3">{children}</div>}
    </div>
  )
}

function Empty({ text }) {
  return <p className="py-3 text-center text-sm text-slate-400">{text}</p>
}
