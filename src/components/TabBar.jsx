import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Ana Sayfa', icon: HomeIcon, end: true },
  { to: '/gruplar', label: 'Gruplar', icon: GroupIcon },
  { to: '/raporlar', label: 'Raporlar', icon: ReportIcon },
  { to: '/profil', label: 'Profil', icon: ProfileIcon },
]

export default function TabBar() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white">
      <div className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-700' : 'text-slate-400'
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10" />
    </svg>
  )
}
function GroupIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  )
}
function ReportIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V9m4 8V5m4 12v-6M5 21h14" />
    </svg>
  )
}
function ProfileIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
