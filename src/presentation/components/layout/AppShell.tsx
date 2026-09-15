import { useState, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/AuthProvider'
import { Sidebar } from '@/presentation/components/layout/Sidebar'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner label="Verificando sessão…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function AppShell() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <Sidebar
        userEmail={user.email}
        onLogout={() => {
          void handleLogout()
        }}
        loggingOut={loggingOut}
      />
      <main className="flex-1 p-5 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
