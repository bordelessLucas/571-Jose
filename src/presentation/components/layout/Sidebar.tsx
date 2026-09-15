import { NavLink } from 'react-router-dom'
import { Button } from '@/presentation/components/ui/Button'

const NAV_ITEMS = [
  { to: '/', label: 'Painel', short: 'P', end: true },
  { to: '/clientes', label: 'Clientes', short: 'C' },
  { to: '/vendedores', label: 'Vendedores', short: 'V' },
  { to: '/vendas', label: 'Vendas', short: 'Vd' },
  { to: '/despesas', label: 'Despesas', short: 'D' },
  { to: '/financeiro', label: 'Financeiro', short: 'F' },
  { to: '/estoque', label: 'Estoque', short: 'E' },
  { to: '/caixa', label: 'Caixa', short: 'Cx' },
  { to: '/dre', label: 'DRE', short: 'DR' },
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
      className={`flex flex-col border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 md:min-h-svh md:border-r ${
        collapsed
          ? 'w-full border-b md:w-16 md:border-b-0'
          : 'w-full border-b md:w-60 md:border-b-0'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 border-b border-[var(--color-border)] ${
          collapsed ? 'px-2 py-3' : 'px-4 py-5'
        }`}
      >
        {collapsed ? (
          <div className="hidden min-w-0 flex-1 text-center md:block">
            <p
              className="text-sm font-semibold text-[var(--color-primary)]"
              title="José — Gestão Comercial"
            >
              J
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
              José
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-primary)]">
              Gestão Comercial
            </p>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 px-2"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? '»' : '«'}
        </Button>
      </div>

      <nav
        aria-label="Navegação principal"
        className={`flex flex-1 gap-1 p-2 ${
          collapsed
            ? 'flex-row overflow-x-auto md:flex-col md:overflow-x-visible'
            : 'flex-row overflow-x-auto md:flex-col'
        }`}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              `rounded-[var(--radius-md)] text-sm font-medium transition ${
                collapsed
                  ? 'min-w-[2.5rem] px-2 py-2 text-center md:min-w-0 md:px-2'
                  : 'whitespace-nowrap px-3 py-2'
              } ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'
              }`
            }
          >
            {collapsed ? (
              <span className="font-semibold tracking-tight md:text-[13px]" aria-hidden>
                {item.short}
              </span>
            ) : (
              item.label
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className={`border-t border-[var(--color-border)] ${collapsed ? 'p-2' : 'p-4'}`}
      >
        {!collapsed ? (
          <p className="mb-3 truncate text-xs text-[var(--color-text-muted)]">{userEmail}</p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={onLogout}
          disabled={loggingOut}
          title="Sair da conta"
          aria-label="Sair da conta"
        >
          {collapsed ? (loggingOut ? '…' : 'Sair') : loggingOut ? 'Saindo…' : 'Sair da conta'}
        </Button>
      </div>
    </aside>
  )
}
