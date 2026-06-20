import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA: /gruplar, /raporlar gibi rotalar index.html'den yüklensin (404 önler)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// Yeni SW aktif olunca tüm sekmeler devralınsın (hemen yenileme)
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Yenile butonunda vite-plugin-pwa'nın gönderdiği mesajı dinle
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// Bildirime tıklanınca uygulamayı ön plana getir veya aç
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if (c.url.startsWith(self.location.origin) && 'focus' in c) return c.focus()
        }
        return clients.openWindow('/')
      }),
  )
})
