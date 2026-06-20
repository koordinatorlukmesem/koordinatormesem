import { createPortal } from 'react-dom'
import ScaledPage from './ScaledPage.jsx'

// Değerlendirme bölümleri (puanlar elle doldurulacak)
const SECTIONS = [
  {
    t: 'A- İş Yerindeki Çalışmaları (0-100 puan)',
    items: [
      '1- Takım, tezgah ve avadanlıkları kullanma, koruma ve temizliğe önem vermesi',
      '2- Yaptığı işin kalite seviyesine uygunluğu ve malzemeyi uygun kullanma.',
    ],
  },
  {
    t: 'B- İşe Yatkınlığı (0-100 puan)',
    items: [
      '1- Bilgi beceri yönünden kendini yetiştirme arzusu',
      '2- İşi öğrenme ve yapabilme yeteneği',
    ],
  },
  {
    t: 'C- Devam Durumu (0-100 puan)',
    items: [
      '1- İş başı ve paydos saatlerine uyması',
      '2- İşe devam durumu (İzinli, izinsiz gelmeme)',
    ],
  },
  {
    t: 'D- Tutum ve Davranışı (0-100 puan)',
    items: [
      '1- İş güvenliğine uygun çalışması',
      '2- Usta ve büyüklerine karşı tutum ve davranışı',
      '3- İş disiplinine uyması',
      '4- İş kıyafeti, düzeni ve temizliğine uyması',
      '5- Arkadaşlarına karşı tutumu',
      '6- Ciddi, dürüst, sözüne güvenilir olması',
    ],
  },
]

function Field({ label, value, lw = '24mm', bold = true, mb = '2px' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: mb }}>
      <span style={{ width: lw, flexShrink: 0 }}>{label}</span>
      <span style={{ flexShrink: 0 }}>:</span>
      <span style={{ flex: 1, marginLeft: '4px', fontWeight: bold ? 700 : 400 }}>
        {value || ''}
      </span>
    </div>
  )
}

function ScoreBox() {
  const cell = { flex: 1, textAlign: 'center', padding: '1px' }
  return (
    <div
      style={{
        width: '38mm', flexShrink: 0, alignSelf: 'center',
        border: '1px solid #000', fontSize: '6.5pt',
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
        <div style={{ ...cell, borderRight: '1px solid #000' }}>Rakamla</div>
        <div style={cell}>Yazıyla</div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ ...cell, borderRight: '1px solid #000', padding: '3px 1px' }}>……………</div>
        <div style={{ ...cell, padding: '3px 1px' }}>………………….</div>
      </div>
    </div>
  )
}

function BeceriForm({ s }) {
  return (
    <div className="bform">
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '8pt', lineHeight: 1.15 }}>
        <div>ÇIRAK ÖĞRENCİNİN İŞLETMELERDE BECERİ EĞİTİMİ</div>
        <div>DEĞERLENDİRME FORMU</div>
      </div>

      {/* üst bilgi: iki sütun (Çırak / İş Yeri Sahibi) — geniş ve ferah */}
      <div style={{ display: 'flex', gap: '6px', border: '1px solid #000', padding: '6px', marginTop: '3px', minHeight: '32mm' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: '5px' }}>Çırak Öğrencinin</div>
          <Field label="Adı Soyadı" value={s.name} lw="30mm" mb="5px" />
          <Field label="Sınıfı" value={s.sube} lw="30mm" mb="5px" />
          <Field label="Numarası" value={s.no} lw="30mm" mb="5px" />
          <Field label="Meslek Alan/Dal" value={s.dal} lw="30mm" mb="5px" />
          <Field label="Form Düzenleme Tarihi" value="...../...../202..." lw="30mm" bold={false} mb="5px" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: '5px' }}>
            İş Yeri Sahibinin (Yasal Temsilcisinin)
          </div>
          <Field label="Adı Soyadı" value={s.businessName} lw="22mm" mb="5px" />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>Kaşe</div>
        </div>
      </div>

      {/* değerlendirme (sayfaya dikey yayılır) */}
      <div style={{ fontWeight: 700, margin: '3px 0 1px' }}>Çırak Öğrencinin</div>
      <div className="bform-body">
        {SECTIONS.map((sec) => (
          <div
            key={sec.t}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderBottom: '1px dotted #000',
              paddingBottom: '3px',
            }}
          >
            <div style={{ fontWeight: 700 }}>{sec.t}</div>
            <div style={{ flex: 1, display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                {sec.items.map((it) => (
                  <div key={it} style={{ paddingLeft: '6px' }}>{it}</div>
                ))}
              </div>
              <ScoreBox />
            </div>
          </div>
        ))}

        {/* en alt: iki noktalı satır (dar) */}
        <div style={{ paddingTop: '3px' }}>
          <div style={{ borderBottom: '1px dotted #000', height: '7px' }} />
          <div style={{ borderBottom: '1px dotted #000', height: '7px' }} />
        </div>
      </div>

      {/* imza alanı */}
      <div style={{ display: 'flex', gap: '4px', border: '1px solid #000', padding: '3px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontStyle: 'italic' }}>Usta Öğreticinin:</div>
          <Field label="Adı Soyadı" value={s.usta} lw="22mm" />
          <div>İmzası : ………………………</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontStyle: 'italic' }}>Koordinatör Öğretmenin:</div>
          <Field label="Adı Soyadı" value={s.teacherName} lw="22mm" />
          <div>İmzası : ………………………</div>
        </div>
      </div>
    </div>
  )
}

// öğrencileri ikişerli sayfalara böl (sol form + sağ form)
function pair(list) {
  const out = []
  for (let i = 0; i < list.length; i += 2) out.push([list[i], list[i + 1] || null])
  return out
}

export default function BeceriFormPrint({ students, onClose }) {
  const sheets = pair(students)

  return createPortal(
    <div className="print-overlay">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 bg-slate-800 px-4 py-3 text-white">
        <div className="text-sm">
          <p className="font-semibold">Beceri Eğitimi Değerlendirme Formu</p>
          <p className="text-xs text-slate-300">{students.length} öğrenci • {sheets.length} sayfa (A4)</p>
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
        "PDF / Yazdır" → hedef olarak <b>PDF olarak kaydet</b>'i seçip telefonunuza indirin.
      </p>

      {sheets.map((p, i) => (
        <ScaledPage key={i} widthMm={297} heightMm={210}>
          <div className="a4-sheet">
            {p[0] ? <BeceriForm s={p[0]} /> : <div className="bform-empty" />}
            {p[1] ? <BeceriForm s={p[1]} /> : <div className="bform-empty" />}
          </div>
        </ScaledPage>
      ))}
    </div>,
    document.body,
  )
}
