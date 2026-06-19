import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SwipeRow from '../components/SwipeRow.jsx'

function fmtDate(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    groups,
    businesses,
    ungroupedBusinesses,
    setGroupBusinesses,
    addBusinessToGroup,
    controls,
    toggleControl,
  } = useApp()
  const group = groups.find((g) => g.id === id)

  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')

  if (!group) {
    return (
      <div>
        <PageHeader title="Grup" to="/gruplar" />
        <p className="p-6 text-center text-slate-500">Grup bulunamadı.</p>
      </div>
    )
  }

  const selectedIds = new Set(group.businessIds)
  const inGroup = businesses.filter((b) => selectedIds.has(b.id))

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr')
    if (!needle) return ungroupedBusinesses
    return ungroupedBusinesses.filter((b) =>
      b.name.toLocaleLowerCase('tr').includes(needle),
    )
  }, [ungroupedBusinesses, q])

  function removeFromGroup(bid) {
    setGroupBusinesses(group.id, group.businessIds.filter((x) => x !== bid))
  }

  return (
    <div>
      <PageHeader title={group.name} to="/gruplar" />

      <div className="p-4">
        {!adding ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500">
                Gruptaki İşletmeler ({inGroup.length})
              </h2>
              <button
                onClick={() => setAdding(true)}
                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white active:bg-blue-800"
              >
                + İşletme Ekle
              </button>
            </div>

            {inGroup.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400">
                Bu grupta henüz işletme yok.
              </div>
            ) : (
              <>
                <p className="mb-2 px-1 text-xs text-slate-400">
                  İpucu: çıkarmak için satırı sola kaydırın.
                </p>
                <ul className="space-y-2">
                  {inGroup.map((b) => {
                    const checkedAt = controls[b.id]
                    return (
                      <li key={b.id}>
                        <SwipeRow
                          actionWidth={96}
                          actions={[
                            {
                              label: 'Çıkar',
                              className: 'bg-red-600',
                              onClick: () => removeFromGroup(b.id),
                            },
                          ]}
                        >
                          <div className="bg-white p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/isletme/${b.id}`)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="truncate text-sm font-semibold text-slate-800">{b.name}</p>
                                <p className="truncate text-xs text-slate-500">
                                  {b.dal} • {b.students.length} öğrenci
                                </p>
                              </button>
                              <button
                                onClick={() => toggleControl(b.id)}
                                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                                  checkedAt
                                    ? 'border-green-300 bg-green-500/15 text-green-700'
                                    : 'border-red-300 bg-red-500/15 text-red-600'
                                }`}
                              >
                                Kontrol Edildi
                              </button>
                            </div>
                            {checkedAt && (
                              <p className="mt-1 text-right text-[11px] text-green-600">
                                {fmtDate(checkedAt)}
                              </p>
                            )}
                          </div>
                        </SwipeRow>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500">
                İşletme ekle ({ungroupedBusinesses.length} eklenebilir)
              </h2>
              <button
                onClick={() => {
                  setAdding(false)
                  setQ('')
                }}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-green-700"
              >
                Bitti
              </button>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İşletme ara..."
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />

            {filtered.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400">
                Eklenebilecek (gruba dahil olmayan) işletme yok.
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => addBusinessToGroup(group.id, b.id)}
                      className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm active:bg-blue-50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        +
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">{b.name}</span>
                        <span className="block truncate text-xs text-slate-500">{b.dal}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
