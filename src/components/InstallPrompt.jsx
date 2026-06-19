import { useEffect, useState } from 'react'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [standalone, setStandalone] = useState(isStandalone())

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
    }
    function onInstalled() {
      setStandalone(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // zaten yüklüyse ya da bu oturumda kapatıldıysa gösterme
  if (standalone || dismissed) return null

  async function install() {
    if (!deferred) return
    deferred.prompt()
    const res = await deferred.userChoice
    setDeferred(null)
    if (res?.outcome === 'accepted') setStandalone(true)
  }

  return (
    <div className="mb-3 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">Uygulamayı ana ekrana ekle</p>
        {deferred ? (
          <p className="text-xs text-slate-500">Tek dokunuşla telefonuna uygulama gibi kur.</p>
        ) : isIOS() ? (
          <p className="text-xs text-slate-500">
            Safari'de <b>Paylaş</b> ⎙ → <b>Ana Ekrana Ekle</b>'yi seç.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Tarayıcı menüsü (⋮) → <b>Ana ekrana ekle / Uygulamayı yükle</b>.
          </p>
        )}
        {deferred && (
          <button
            onClick={install}
            className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-blue-700"
          >
            Ana Ekrana Ekle
          </button>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1 text-slate-400 active:bg-slate-200"
        aria-label="Kapat"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
