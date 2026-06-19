import { useRef, useState } from 'react'

// Sola kaydırınca sağdaki aksiyonları (Değiştir / Sil) açar.
// actions: [{ label, onClick, className }]
export default function SwipeRow({ children, actions, actionWidth = 152 }) {
  const [x, setX] = useState(0)
  const startX = useRef(null)
  const moved = useRef(false)

  function down(e) {
    startX.current = e.clientX - x
    moved.current = false
  }
  function move(e) {
    if (startX.current == null) return
    let nx = e.clientX - startX.current
    if (nx > 0) nx = 0
    if (nx < -actionWidth) nx = -actionWidth
    if (Math.abs(nx - x) > 3) moved.current = true
    setX(nx)
  }
  function up() {
    if (startX.current == null) return
    startX.current = null
    setX(x < -actionWidth / 2 ? -actionWidth : 0)
  }
  function close() {
    setX(0)
  }
  function onClickCapture(e) {
    // kaydırma sonrası ya da açıkken tıklama navigasyona gitmesin
    if (moved.current || x !== 0) {
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => {
              close()
              a.onClick()
            }}
            style={{ width: actionWidth / actions.length }}
            className={`flex flex-col items-center justify-center text-xs font-bold text-white ${a.className}`}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={onClickCapture}
        style={{
          transform: `translateX(${x}px)`,
          transition: startX.current == null ? 'transform .2s ease' : 'none',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  )
}
