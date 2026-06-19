import { Outlet } from 'react-router-dom'
import TabBar from './TabBar.jsx'

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
