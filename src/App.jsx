import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './lib/store.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Home from './pages/Home.jsx'
import BusinessDetail from './pages/BusinessDetail.jsx'
import Groups from './pages/Groups.jsx'
import GroupDetail from './pages/GroupDetail.jsx'
import Reports from './pages/Reports.jsx'
import Profile from './pages/Profile.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'

export default function App() {
  const { teacher, isAdmin, authReady } = useApp()

  if (!authReady && !isAdmin) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm">Yükleniyor…</p>
        </div>
      </div>
    )
  }

  let routes
  if (isAdmin) {
    routes = (
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    )
  } else if (!teacher) {
    routes = (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  } else {
    routes = (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/isletme/:id" element={<BusinessDetail />} />
          <Route path="/gruplar" element={<Groups />} />
          <Route path="/gruplar/:id" element={<GroupDetail />} />
          <Route path="/raporlar" element={<Reports />} />
          <Route path="/profil" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <>
      {routes}
      <UpdatePrompt />
    </>
  )
}
