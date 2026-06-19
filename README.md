# İşletme Takip Sistemi (Koordinatör MESEM) — Prototip

MESEM koordinatör öğretmenlerin işletme/öğrenci takibi için mobil PWA.
Bu aşama **çalışan ön yüz prototipidir**; veri şimdilik Excel'den üretilen
`src/data/seed.json` dosyasından gelir (mock backend). Sonraki adımda backend
Supabase'e taşınacak.

## Çalıştırma

```bash
npm install
npm run seed     # Excel -> src/data/seed.json (yol scripts/genseed.mjs içinde)
npm run dev      # http://localhost:5173
```

Demo giriş: listeden bir öğretmen seç + PIN **1234**.
Yönetici girişi: giriş ekranında "Yönetici Girişi" → şifre **admin123**.

## Yapı

```
scripts/genseed.mjs   Excel'i okuyup seed.json üretir (geliştirme aracı)
src/data/seed.json    Üretilen veri (öğretmen, işletme, öğrenci)
src/lib/store.jsx     Veri katmanı + auth + gruplar (Supabase'e geçince burası değişecek)
src/components/        Header, TabBar, Layout, PageHeader
src/pages/            Login, Home, BusinessDetail, Groups, GroupDetail, Reports, Profile
```

## Ekranlar

1. Giriş — öğretmen seç + PIN, oturum kalıcı; ayrıca yönetici girişi
2. Ana Sayfa — estetik gradient header (okul adı / işletme-öğrenci sayısı / öğretmen); isim sıralı işletme listesi + arama
3. İşletme detay — Usta Öğretici, Dal, Çalışan Öğrenciler (öğrenci seç → Şube/No + Devamsızlık; okul ≥5.5 veya işletme ≥25 ise **KRİTİK!**), Adres, Yol Tarifi/Ara, harita
4. Gruplar — sabit özel kartlar (Yeni Eklenen İşletme / Yeni Eklenen Öğrenci + "İşletmesine Gönder" / Fesih Yapılan Öğrenciler — "<tarih> öncesi fesih yapılmış."); kullanıcı grupları (oluştur, **sola kaydır → Değiştir/Sil**, içine işletme ekle/çıkar)
5. Raporlar — placeholder (sonra)
6. Profil — öğretmen adı, **şifre değiştir**, Çıkış Yap
7. Yönetici Paneli — okul adını değiştir, **Excel yükle** (önceki veriyle diff → yeni/fesih), tüm öğretmenleri ve şifrelerini görüntüle

## Bilinen sınırlar (Supabase'de çözülecek)

- İşletme ID'leri her Excel yüklemesinde yeniden üretilir; tekrar yükleme sonrası grup üyelikleri (ID bazlı) kayabilir → Supabase'de kalıcı ID/anahtar.
- Yeni Excel'de "yeni/fesih" yalnızca bir önceki yüklemeyle karşılaştırılır (anlık tarih damgası). Supabase'de sürüm geçmişi tutulacak.

## Notlar

- Excel'de GPS yok; harita ve yol tarifi adresi Google Maps'e geocode ederek çalışır.
- Dal ve Usta Öğretici öğrenci bazında değişebildiği için öğrenci seçilince detay güncellenir.
- Hassas alanlar (TC) seed'e dahil edilmez.

## Sıradaki: Supabase'e geçiş

`src/lib/store.jsx` içindeki fonksiyonların gövdeleri Supabase çağrılarıyla
değişecek; ekranlar aynı kalacak. Tablolar: `schools`, `teachers`,
`businesses`, `students`, `groups`, `group_businesses` + RLS (her öğretmen
yalnız kendi verisini görür) + admin için Excel yükleme.
