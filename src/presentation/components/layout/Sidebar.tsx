import { NavLink } from 'react-router-dom'
import { Button } from '@/presentation/components/ui/Button'

const NAV_ITEMS = [
  { to: '/', label: 'Painel', end: true },
  { to: '/clientes', label: 'Clientes' },
  { to: '/vendedores', label: 'Vendedores' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/despesas', label: 'Despesas' },
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/caixa', label: 'Caixa' },
  { to: '/dre', label: 'DRE' },
] as const

type SidebarProps = {
  userEmail: string
  onLogout: () => void
  loggingOut: boolean
}

export function Sidebar({ userEmail, onLogout, loggingOut }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col border-b border-[var(--color-border)] bg-[var(--color-surface)] md:min-h-svh md:w-60 md:border-r md:border-b-0">
      <div className="border-b border-[var(--color-border)] px-4 py-5">
        <p className="text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
          José
        </p>
        <p className="mt-1 text-lg font-semibold text-[var(--color-primary)]">
          Gestão Comercial
        </p>
      </div>

      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto p-3 md:flex-col">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-4">
        <p className="mb-3 truncate text-xs text-[var(--color-text-muted)]">{userEmail}</p>
        <Button
          variant="secondary"
          className="w-full"
          onClick={onLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Saindo…' : 'Sair da conta'}
        </Button>
      </div>
    </aside>
  )
}
