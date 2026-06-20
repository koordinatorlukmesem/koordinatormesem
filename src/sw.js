import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

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
