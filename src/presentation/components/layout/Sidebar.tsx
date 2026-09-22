import {
  Bank,
  CaretLeft,
  CashRegister,
  ChartLineUp,
  Gauge,
  Money,
  Package,
  Receipt,
  SignOut,
  Truck,
  UserList,
  UsersThree,
} from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/presentation/components/ui/Button'

const ICON_SIZE = 20

const NAV_ITEMS = [
  { to: '/', label: 'Painel', icon: Gauge, end: true },
  { to: '/clientes', label: 'Clientes', icon: UserList },
  { to: '/vendedores', label: 'Vendedores', icon: UsersThree },
  { to: '/vendas', label: 'Vendas', icon: Receipt },
  { to: '/entregas', label: 'Entregas', icon: Truck },
  { to: '/fiscal', label: 'Fiscal', icon: Receipt },
  { to: '/despesas', label: 'Despesas', icon: Money },
  { to: '/financeiro', label: 'Financeiro', icon: Bank },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/caixa', label: 'Caixa', icon: CashRegister },
  { to: '/dre', label: 'DRE', icon: ChartLineUp },
] as const

type SidebarProps = {
  userEmail: string
  onLogout: () => void
  loggingOut: boolean
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({
  userEmail,
  onLogout,
  loggingOut,
  collapsed,
  onToggle,
}: SidebarProps) {
  return (
    <aside
      className={`surface-panel z-30 flex flex-col border-[var(--color-border)] transition-[width,box-shadow] duration-300 ease-[var(--motion-ease)] md:fixed md:inset-y-0 md:left-0 md:h-svh md:border-r ${
        collapsed
          ? 'w-full border-b md:w-[4.5rem] md:border-b-0'
          : 'w-full border-b md:w-64 md:border-b-0'
      }`}
    >
      <div
        className={`flex items-center gap-2 border-b border-[var(--color-border)] ${
          collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-5'
        }`}
      >
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white shadow-[0_12px_28px_rgb(15_76_92_/_0.18)]">
              <Truck size={22} weight="duotone" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                Jose
              </p>
              <p className="mt-1 truncate text-lg font-semibold text-[var(--color-primary)]">
                Gestao Comercial
              </p>
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className={collapsed ? 'h-10 w-10 p-0' : 'shrink-0 px-2'}
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <CaretLeft
            size={16}
            weight="bold"
            aria-hidden
            className={`transition-transform duration-300 ease-[var(--motion-ease)] ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </Button>
      </div>

      <nav
        aria-label="Navegacao principal"
        className={`flex flex-1 gap-1 p-2 ${
          collapsed
            ? 'flex-row overflow-x-auto md:flex-col md:overflow-x-visible md:overflow-y-auto'
            : 'flex-row overflow-x-auto md:flex-col md:overflow-x-visible md:overflow-y-auto'
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                `group relative flex items-center rounded-[var(--radius-md)] text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-[var(--motion-ease)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] ${
                  collapsed
                    ? 'min-w-[2.75rem] justify-center px-3 py-2.5 md:min-w-0'
                    : 'min-w-max gap-3 whitespace-nowrap px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-[0_10px_24px_rgb(15_76_92_/_0.18)]'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
                }`
              }
            >
              <Icon
                size={ICON_SIZE}
                weight="duotone"
                aria-hidden
                className="shrink-0"
              />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>

      <div
        className={`border-t border-[var(--color-border)] ${collapsed ? 'p-2' : 'p-4'}`}
      >
        {!collapsed ? (
          <p className="mb-3 truncate text-xs text-[var(--color-text-muted)]" translate="no">
            {userEmail}
          </p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className={collapsed ? 'h-10 w-full p-0' : 'w-full'}
          onClick={onLogout}
          disabled={loggingOut}
          title="Sair da conta"
          aria-label="Sair da conta"
        >
          <SignOut size={16} weight="duotone" aria-hidden />
          {!collapsed ? (loggingOut ? 'Saindo...' : 'Sair da conta') : null}
        </Button>
      </div>
    </aside>
  )
}
