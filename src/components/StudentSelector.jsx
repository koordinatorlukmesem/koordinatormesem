import { useMemo, useState } from 'react'

// Öğrenci seçim arayüzü (TÜMÜ / Seçerek) + "Formu Hazırla" butonu.
// onPrepare(list): seçilen öğrenci nesneleriyle çağrılır.
export default function StudentSelector({ businesses, teacher, buttonLabel = 'Formu Hazırla', onPrepare }) {
  const [mode, setMode] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [expanded, setExpanded] = useState(() => new Set())
  const [q, setQ] = useState('')

  const allStudents = useMemo(() => {
    const out = []
    for (const b of businesses) {
      for (const s of b.students) {
        out.push({
          id: s.id,
          name: s.name,
          sinif: s.sinif,
          no: s.no,
          dal: s.dal,
          usta: s.usta,
          sube: s.sube,
          tel: s.tel,
          businessName: b.name,
          businessAddress: b.address,
          businessPhone: b.phone,
          teacherName: teacher.name,
        })
      }
    }
    return out
  }, [businesses, teacher])

  const filteredBiz = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr')
    if (!needle) return businesses
    return businesses.filter((b) => b.name.toLocaleLowerCase('tr').includes(needle))
  }, [businesses, q])

  function toggleStudent(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  function toggleBusiness(b) {
    const next = new Set(selected)
    const allIn = b.students.every((s) => next.has(s.id))
    b.students.forEach((s) => (allIn ? next.delete(s.id) : next.add(s.id)))
    setSelected(next)
  }
  function toggleExpand(id) {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  function prepare() {
    const list =
      mode === 'all' ? allStudents : allStudents.filter((s) => selected.has(s.id))
    if (list.length) onPrepare(list)
  }

  const count = mode === 'all' ? allStudents.length : selected.size

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('all')}
          className={`rounded-xl py-2 text-sm font-semibold ${
            mode === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          TÜMÜ
        </button>
        <button
          onClick={() => setMode('select')}
          className={`rounded-xl py-2 text-sm font-semibold ${
            mode === 'select' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Seçerek
        </button>
      </div>

      {mode === 'all' ? (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Tüm <b>{allStudents.length}</b> öğrenci için form hazırlanacak.
        </p>
      ) : (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İşletme ara..."
            className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <ul className="max-h-80 space-y-1 overflow-auto">
            {filteredBiz.map((b) => {
              const inCount = b.students.filter((s) => selected.has(s.id)).length
              const allIn = inCount === b.students.length && inCount > 0
              return (
                <li key={b.id} className="rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 p-2">
                    <input
                      type="checkbox"
                      checked={allIn}
                      ref={(el) => el && (el.indeterminate = inCount > 0 && !allIn)}
                      onChange={() => toggleBusiness(b)}
                      className="h-4 w-4 shrink-0 accent-blue-600"
                    />
                    <button onClick={() => toggleExpand(b.id)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-semibold text-slate-800">{b.name}</p>
                      <p className="text-xs text-slate-500">
                        {inCount}/{b.students.length} seçili
                      </p>
                    </button>
                    <svg
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        expanded.has(b.id) ? 'rotate-90' : ''
                      }`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      onClick={() => toggleExpand(b.id)}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  {expanded.has(b.id) && (
                    <ul className="space-y-0.5 px-2 pb-2 pl-8">
                      {b.students.map((s) => (
                        <li key={s.id}>
                          <label className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={selected.has(s.id)}
                              onChange={() => toggleStudent(s.id)}
                              className="h-4 w-4 accent-blue-600"
                            />
                            <span className="text-sm text-slate-700">{s.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      <button
        onClick={prepare}
        disabled={count === 0}
        className="mt-3 w-full rounded-xl bg-blue-700 py-3 font-semibold text-white active:bg-blue-800 disabled:bg-slate-300"
      >
        {buttonLabel} ({count})
      </button>
    </div>
  )
}
