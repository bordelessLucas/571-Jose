import { Link } from 'react-router-dom'
import { PageHeader } from '@/presentation/components/ui/PageHeader'

const MODULES = [
  { to: '/clientes', title: 'Clientes', description: 'Cadastro e consulta de clientes' },
  { to: '/vendedores', title: 'Vendedores', description: 'Equipe comercial' },
  { to: '/vendas', title: 'Vendas', description: 'Registros e histórico comercial' },
  { to: '/despesas', title: 'Despesas', description: 'Lançamentos e categorias' },
  { to: '/financeiro', title: 'Financeiro', description: 'Contas a pagar e receber (próximas sprints)' },
  { to: '/estoque', title: 'Estoque', description: 'Itens e quantidades (próximas sprints)' },
  { to: '/caixa', title: 'Caixa', description: 'Entradas e saídas (próximas sprints)' },
  { to: '/dre', title: 'DRE', description: 'Visão simplificada (próximas sprints)' },
] as const

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Painel inicial"
        description="Acesse os módulos do sistema de gestão comercial e financeira."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <Link
            key={module.to}
            to={module.to}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)]"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{module.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
