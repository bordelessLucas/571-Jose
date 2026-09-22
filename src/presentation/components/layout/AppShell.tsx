import { House } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/AuthProvider'
import { Sidebar } from '@/presentation/components/layout/Sidebar'
import { AppSplash } from '@/presentation/components/ui/AppSplash'
import { Button } from '@/presentation/components/ui/Button'

const SIDEBAR_KEY = 'jose.sidebar.collapsed'

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <AppSplash label="Verificando sessao..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function AppShell() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_KEY) === '1'
  })

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

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
      <a href="#main-content" className="skip-link">
        Ir para o conteudo
      </a>
      <Sidebar
        userEmail={user.email}
        onLogout={() => {
          void handleLogout()
        }}
        loggingOut={loggingOut}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin-left] duration-300 ease-[var(--motion-ease)] ${
          collapsed ? 'md:ml-[4.5rem]' : 'md:ml-64'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-2 shadow-[0_10px_30px_rgb(15_76_92_/_0.05)] backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="md:hidden"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              aria-expanded={!collapsed}
            >
              Menu
            </Button>
            <Link
              to="/"
              className="rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
            >
              <Button type="button" variant="secondary">
                <House size={16} weight="duotone" aria-hidden />
                Ir ao painel
              </Button>
            </Link>
          </div>
          <p className="truncate text-xs text-[var(--color-text-muted)]" translate="no">
            {user.email}
          </p>
        </div>
        <main
          id="main-content"
          tabIndex={-1}
          className="app-enter flex-1 scroll-mt-4 p-5 md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
