import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { ModuleCard } from '@/presentation/components/ui/ModuleCard'

const MODULES = [
  { to: '/clientes', title: 'Clientes', description: 'Cadastro, contato e endereço' },
  { to: '/vendedores', title: 'Vendedores', description: 'Equipe comercial ativa' },
  {
    to: '/vendas',
    title: 'Vendas',
    description: 'Pedidos, estoque, pagamentos e NF-e automática',
  },
  { to: '/despesas', title: 'Despesas', description: 'Lançamentos e categorias' },
  {
    to: '/financeiro',
    title: 'Financeiro',
    description: 'Contas a pagar e a receber',
  },
  { to: '/estoque', title: 'Estoque', description: 'Itens e quantidades disponíveis' },
  { to: '/caixa', title: 'Caixa', description: 'Entradas, saídas e saldo' },
  { to: '/dre', title: 'DRE', description: 'Receitas, despesas e resultado' },
] as const

export function DashboardPage() {
  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wide text-[var(--color-text-muted)]">
        José · Gestão Comercial
      </p>
      <PageHeader
        title="Painel inicial"
        description="Acesse os módulos do sistema. Vendas fecham com NF-e e baixa de estoque."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.to}
            to={module.to}
            title={module.title}
            description={module.description}
          />
        ))}
      </div>
    </div>
  )
}
