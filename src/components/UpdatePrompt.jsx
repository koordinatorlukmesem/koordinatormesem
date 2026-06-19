import { useRegisterSW } from 'virtual:pwa-register/react'

// Yeni sürüm yayınlandığında (ana ekrana eklenmiş PWA dahil) algılar,
// "Yeni sürüm mevcut — Yenile" banner'ı gösterir; yenileyince değişiklikler görünür.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return
      const check = () => {
        if (navigator.onLine) r.update()
      }
      // periyodik kontrol (her 60 sn)
      setInterval(check, 60 * 1000)
      // uygulamaya geri dönülünce / sekme görünür olunca kontrol et
      window.addEventListener('focus', check)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  if (!needRefresh && !offlineReady) return null

  function close() {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-md px-4 pb-3">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-800 p-3 text-white shadow-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5.5 9a7 7 0 0111.9-2.4M18.5 15a7 7 0 01-11.9 2.4" />
          </svg>
        </div>
        <p className="min-w-0 flex-1 text-sm font-medium">
          {needRefresh ? 'Yeni sürüm mevcut.' : 'Uygulama çevrimdışı kullanıma hazır.'}
        </p>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold active:bg-blue-700"
          >
            Yenile
          </button>
        )}
        <button
          onClick={close}
          className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-semibold active:bg-white/20"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}
