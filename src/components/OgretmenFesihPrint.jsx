import { createPortal } from 'react-dom'
import ScaledPage from './ScaledPage.jsx'

const today = new Date().toISOString().slice(0, 10)

// numarayı normalize et (başına 0)
function fmtPhone(p) {
  const d = String(p || '').replace(/\D/g, '')
  if (!d) return ''
  return d.startsWith('0') ? d : '0' + d
}
// şube içindeki paranteze yazılı günü çek: "FRN/11A (ÇARŞAMBA) ..." -> ÇARŞAMBA
function teorikGun(sube) {
  return (String(sube || '').match(/\(([^)]+)\)/)?.[1] || '').trim()
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ border: '1px solid #000', padding: '3px 6px', width: '34%', verticalAlign: 'top' }}>
        {label}
      </td>
      <td style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 700 }}>{value || ''}</td>
    </tr>
  )
}

function FesihForm({ s, school }) {
  return (
    <div className="fesih-sheet" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* başlık */}
      <div style={{ textAlign: 'center', fontWeight: 700, lineHeight: 1.3 }}>
        <div>{(school || '').toLocaleUpperCase('tr')} MÜDÜRLÜĞÜ</div>
        <div>İŞLETMELERDE MESLEK EĞİTİMİ</div>
        <div>KOORDİNATÖR ÖĞRETMEN RAPORU</div>
      </div>

      <div style={{ marginTop: '10px', fontWeight: 700, textDecoration: 'underline' }}>ÖĞRENCİNİN</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
        <tbody>
          <Row label="Adı Soyadı" value={s.name} />
          <Row label="Alan/Dal" value={s.dal} />
          <Row label="Sınıfı" value={s.sube} />
          <Row label="Numarası" value={s.no} />
          <Row label="Usta öğreticisi" value={s.usta} />
          <Row label="İşyeri Adresi" value={s.businessAddress} />
          <Row label="İşyeri Telefonu" value={fmtPhone(s.businessPhone)} />
          <Row label="Teorik Eğt Geldiği Gün" value={teorikGun(s.sube)} />
        </tbody>
      </table>

      <div style={{ marginTop: '12px', fontWeight: 700, textDecoration: 'underline' }}>
        ÖĞRETMENİN GÖRÜŞLERİ :
      </div>
      <p style={{ marginTop: '6px', textAlign: 'justify', textIndent: '20px' }}>
        Yukarıda bilgileri yazılı olan ve işyerinde sözleşmeli çırak olarak çalışan okulumuz
        öğrencisinin aşağıda belirttiğim nedenlerden dolayı sözleşmesinin fesih edilmesi
        gerekmektedir. Bilgilerinize arz ederim.
      </p>

      <div style={{ marginTop: '12px', fontWeight: 700, textDecoration: 'underline' }}>AÇIKLAMA :</div>
      <div
        contentEditable
        suppressContentEditableWarning
        data-ph="Açıklama yazın..."
        className="aciklama-box"
        style={{ flex: 1, minHeight: '45mm', marginTop: '4px', padding: '4px 2px', outline: 'none' }}
      />

      {/* alt: tarih / imza / öğretmen */}
      <div style={{ marginTop: '12px', alignSelf: 'flex-end', textAlign: 'left', minWidth: '60mm' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Tarih :</span>
          <input type="date" defaultValue={today} className="fesih-date" />
        </div>
        <div style={{ marginTop: '4px' }}>İmza : …………………………</div>
        <div style={{ marginTop: '18px', fontWeight: 700 }}>{s.teacherName}</div>
        <div>Koordinatör Öğretmen</div>
      </div>
    </div>
  )
}

export default function OgretmenFesihPrint({ students, school, onClose }) {
  return createPortal(
    <div className="print-overlay">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 bg-slate-800 px-4 py-3 text-white">
        <div className="text-sm">
          <p className="font-semibold">Öğretmen Fesih Formu (Tek Taraflı)</p>
          <p className="text-xs text-slate-300">{students.length} form (A4 dikey) • açıklama ve tarihi doldurun</p>
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
        AÇIKLAMA kutusuna yazıp tarihi seçin, sonra "PDF / Yazdır" → <b>PDF olarak kaydet</b>.
      </p>

      {students.map((s) => (
        <ScaledPage key={s.id} widthMm={210} heightMm={297}>
          <FesihForm s={s} school={school} />
        </ScaledPage>
      ))}
    </div>,
    document.body,
  )
}
