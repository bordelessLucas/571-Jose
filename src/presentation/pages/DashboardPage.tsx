import { Link } from 'react-router-dom'
import { PageHeader } from '@/presentation/components/ui/PageHeader'

const MODULES = [
  { to: '/clientes', title: 'Clientes', description: 'Cadastro e consulta de clientes' },
  { to: '/vendedores', title: 'Vendedores', description: 'Equipe comercial' },
  { to: '/vendas', title: 'Vendas', description: 'Registros e histórico comercial' },
  { to: '/despesas', title: 'Despesas', description: 'Lançamentos e categorias' },
  {
    to: '/financeiro',
    title: 'Financeiro',
    description: 'Contas a pagar e a receber',
  },
  { to: '/estoque', title: 'Estoque', description: 'Itens e quantidades' },
  { to: '/caixa', title: 'Caixa', description: 'Entradas, saídas e saldo' },
  { to: '/dre', title: 'DRE', description: 'Receitas, despesas e resultado' },
] as const

export function DashboardPage() {
  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
        José · Gestão Comercial
      </p>
      <PageHeader
        title="Painel inicial"
        description="Acesse os módulos do sistema de gestão comercial e financeira."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <Link
            key={module.to}
            to={module.to}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{module.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
