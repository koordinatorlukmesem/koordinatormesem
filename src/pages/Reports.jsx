import { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import StudentSelector from '../components/StudentSelector.jsx'
import BeceriFormPrint from '../components/BeceriFormPrint.jsx'
import OgretmenFesihPrint from '../components/OgretmenFesihPrint.jsx'
import IsyeriFesihPrint from '../components/IsyeriFesihPrint.jsx'

export default function Reports() {
  const { businesses, teacher, school } = useApp()
  const [openCard, setOpenCard] = useState(null)
  const [beceriList, setBeceriList] = useState(null)
  const [fesihList, setFesihList] = useState(null)
  const [isyeriList, setIsyeriList] = useState(null)

  const toggle = (k) => setOpenCard((o) => (o === k ? null : k))

  return (
    <div>
      <header className="safe-top bg-blue-700 px-4 pb-4 pt-4 text-white shadow">
        <h1 className="text-lg font-bold">Raporlar</h1>
      </header>

      <div className="space-y-3 p-4">
        <ReportCard
          icon="📄"
          title="Beceri Eğitimi Değerlendirme Formu"
          subtitle="A4'e 2 form • PDF olarak indir"
          open={openCard === 'beceri'}
          onToggle={() => toggle('beceri')}
        >
          <StudentSelector businesses={businesses} teacher={teacher} onPrepare={setBeceriList} />
        </ReportCard>

        <ReportCard
          icon="📝"
          title="Öğretmen Fesih Formu (Tek Taraflı)"
          subtitle="Sayfa başına 1 form • PDF olarak indir"
          open={openCard === 'fesih'}
          onToggle={() => toggle('fesih')}
        >
          <StudentSelector businesses={businesses} teacher={teacher} onPrepare={setFesihList} />
        </ReportCard>

        <ReportCard
          icon="🏢"
          title="İşyeri Fesih Formu"
          subtitle="A4 dikey • sayfada 2 dilekçe • PDF olarak indir"
          open={openCard === 'isyeri'}
          onToggle={() => toggle('isyeri')}
        >
          <StudentSelector businesses={businesses} teacher={teacher} onPrepare={setIsyeriList} />
        </ReportCard>
      </div>

      {beceriList && (
        <BeceriFormPrint students={beceriList} onClose={() => setBeceriList(null)} />
      )}
      {fesihList && (
        <OgretmenFesihPrint students={fesihList} school={school} onClose={() => setFesihList(null)} />
      )}
      {isyeriList && (
        <IsyeriFesihPrint students={isyeriList} school={school} onClose={() => setIsyeriList(null)} />
      )}
    </div>
  )
}

function ReportCard({ icon, title, subtitle, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left active:bg-slate-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-lg text-blue-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
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
