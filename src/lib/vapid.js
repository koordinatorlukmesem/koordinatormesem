// VAPID public key — herkese açık, git'e eklenebilir
export const VAPID_PUBLIC_KEY =
  'BF_5imh8Tm6i_FTpkjpMvCtzJuad87JVIfWsQFu5io8ch9BtYX6glQQ8roQs60dKUcPpWZ8tqpfmzi7q0u6f2nQ'

// PushManager.subscribe için base64url → Uint8Array dönüşümü
export function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}
