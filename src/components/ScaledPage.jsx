const MM = 96 / 25.4

export default function ScaledPage({ widthMm, heightMm, children }) {
  const wPx = widthMm * MM
  const hPx = heightMm * MM
  const avail = typeof window !== 'undefined' ? window.innerWidth - 8 : wPx
  const scale = Math.min(1, avail / wPx)

  if (scale >= 1) {
    return <div className="sheet-outer">{children}</div>
  }

  return (
    <div
      className="sheet-outer"
      style={{ width: Math.round(wPx * scale), height: Math.round(hPx * scale), overflow: 'hidden' }}
    >
      <div
        className="sheet-inner"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', display: 'inline-block' }}
      >
        {children}
      </div>
    </div>
  )
}
