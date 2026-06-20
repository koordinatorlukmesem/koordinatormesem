import { createPortal } from 'react-dom'
import ScaledPage from './ScaledPage.jsx'

function Field({ label, value, lw = '40mm' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
      <span style={{ width: lw, flexShrink: 0, fontWeight: 700 }}>{label}</span>
      <span style={{ flexShrink: 0 }}>:</span>
      <span
        style={{
          flex: 1, marginLeft: '6px', borderBottom: '1px dotted #555', fontWeight: 700,
        }}
      >
        {value || ''}
      </span>
    </div>
  )
}

function Petition({ s, school }) {
  return (
    <div className="isyeri-petition">
      <div style={{ textAlign: 'center', fontWeight: 700, lineHeight: 1.25 }}>
        {(school || '').toLocaleUpperCase('tr')} MÜDÜRLÜĞÜNE
      </div>

      <div style={{ marginTop: '8px', fontWeight: 700, textDecoration: 'underline' }}>
        Çırak Öğrencinin Bilgileri
      </div>
      <div style={{ marginTop: '4px' }}>
        <Field label="*Adı ve Soyadı" value={s.name} />
        <Field label="*TC Kimlik NO" value="" />
        <Field label="*Okul NO / SINIF" value={`${s.no || ''} / ${s.sube || ''}`} />
        <Field label="Alan/Dal (Meslek)" value={s.dal} />
      </div>

      <p style={{ marginTop: '8px', textAlign: 'justify', textIndent: '20px' }}>
        Yukarıda bilgileri yazılı olan ve işyerimde sözleşmeli çırak olarak çalışan, okulunuz
        öğrencisi, çıraklık sözleşmesindeki tüm sorumluluklarımı yerine getirdiğim halde hiçbir
        mazeret göstermeden işyerimden ......./……../20….. tarihinde ayrılmıştır. Adı geçen
        öğrencinin sözleşmesi feshedilmiştir.
      </p>
      <p style={{ marginTop: '2px' }}>Gereğini bilgilerinize arz ederim.</p>

      <div style={{ marginTop: '6px' }}>
        Adres : <b>{s.businessName}</b>
        {s.businessAddress ? ` - ${s.businessAddress}` : ''}
      </div>

      {/* alt blok: tarih (boş) / imza-kaşe / koordinatör */}
      <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
        <div style={{ textAlign: 'right', lineHeight: 1.4 }}>
          <div>..../....../20...</div>
          <div>İMZA ve KAŞE</div>
        </div>
        <div style={{ marginTop: '6px' }}>
          <b>Koord. Öğr:</b> {s.teacherName}
        </div>
      </div>
    </div>
  )
}

function pair(list) {
  const out = []
  for (let i = 0; i < list.length; i += 2) out.push([list[i], list[i + 1] || null])
  return out
}

export default function IsyeriFesihPrint({ students, school, onClose }) {
  const sheets = pair(students)
  return createPortal(
    <div className="print-overlay">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 bg-slate-800 px-4 py-3 text-white">
        <div className="text-sm">
          <p className="font-semibold">İşyeri Fesih Formu</p>
          <p className="text-xs text-slate-300">{students.length} dilekçe • A4 dikey, sayfada 2</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold active:bg-blue-700"
          >
            PDF / Yazdır
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold active:bg-white/20"
          >
            Kapat
          </button>
        </div>
      </div>

      <p className="no-print px-4 py-2 text-center text-xs text-slate-200">
        Tarih alanları elle doldurulmak üzere boştur. "PDF / Yazdır" → <b>PDF olarak kaydet</b>.
      </p>

      {sheets.map((p, i) => (
        <ScaledPage key={i} widthMm={210} heightMm={297}>
          <div className="isyeri-sheet">
            {p[0] && <Petition s={p[0]} school={school} />}
            <div className="isyeri-divider" />
            {p[1] ? <Petition s={p[1]} school={school} /> : <div className="isyeri-petition" />}
          </div>
        </ScaledPage>
      ))}
    </div>,
    document.body,
  )
}
