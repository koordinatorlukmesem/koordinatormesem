import { useApp } from '../lib/store.jsx'

const MEM = 'Mesleki Eğitim Merkezi'

// Okul adını ikiye böl: "Mesleki Eğitim Merkezi" her zaman alt satırda.
function splitSchool(school) {
  const idx = school.indexOf(MEM)
  if (idx >= 0) {
    return { line1: school.slice(0, idx).trim(), line2: school.slice(idx).trim() }
  }
  return { line1: school.trim(), line2: MEM }
}

export default function Header() {
  const { school, teacher } = useApp()
  const { line1, line2 } = splitSchool(school)
  const initials = teacher.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="safe-top relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-4 pb-6 pt-5 text-white shadow-xl">
      {/* dekoratif daireler */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 top-10 h-24 w-24 rounded-full bg-white/10" />

      {/* okul simgesi + adı (Mesleki Eğitim Merkezi her zaman alt satırda) */}
      <div className="relative flex flex-col items-center">
        <svg className="h-8 w-8 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 8l10 5 10-5-10-5zM6 10.5V16c0 1 2.7 3 6 3s6-2 6-3v-5.5" />
        </svg>
        <h1 className="mt-1.5 text-center leading-tight">
          {line1 && <span className="block text-sm font-medium text-sky-100">{line1}</span>}
          <span className="block text-base font-bold tracking-wide">{line2}</span>
        </h1>
      </div>

      {/* sayaçlar */}
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <Stat value={teacher.businessCount} label="İşletme" icon={BizIcon} />
        <Stat value={teacher.studentCount} label="Öğrenci" icon={StuIcon} />
      </div>

      {/* öğretmen */}
      <div className="relative mt-5 flex items-center gap-3 rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-700 shadow">
          {initials}
        </div>
        <div className="leading-tight">
          <p className="text-[11px] text-sky-100">Koordinatör Öğretmen</p>
          <p className="text-sm font-semibold">{teacher.name}</p>
        </div>
      </div>
    </header>
  )
}

function Stat({ value, label, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-3 py-3 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25">
        <Icon />
      </div>
      <div className="leading-none">
        <div className="text-2xl font-extrabold">{value}</div>
        <div className="mt-0.5 text-[11px] font-medium text-sky-100">{label}</div>
      </div>
    </div>
  )
}

function BizIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V9l9-6 9 6v12M3 21h18M9 21v-6h6v6" />
    </svg>
  )
}
function StuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v7m-5-9v4c0 1 2 2 5 2s5-1 5-2v-4" />
    </svg>
  )
}
