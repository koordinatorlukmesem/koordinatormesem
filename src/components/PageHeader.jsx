import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, to = -1 }) {
  const navigate = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-10 flex items-center gap-2 bg-blue-700 px-3 py-3 text-white shadow">
      <button
        onClick={() => navigate(to)}
        className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/15"
        aria-label="Geri"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 className="truncate text-base font-semibold">{title}</h1>
    </header>
  )
}
