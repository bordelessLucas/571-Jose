import {
  Bank,
  CashRegister,
  ChartLineUp,
  Money,
  Package,
  Receipt,
  UserList,
  UsersThree,
  Truck,
} from '@phosphor-icons/react'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { ModuleCard } from '@/presentation/components/ui/ModuleCard'

const MODULES = [
  { to: '/clientes', title: 'Clientes', description: 'Cadastro, contato e endereco', icon: UserList },
  { to: '/vendedores', title: 'Vendedores', description: 'Equipe comercial ativa', icon: UsersThree },
  {
    to: '/vendas',
    title: 'Vendas',
    description: 'Pedidos, estoque, pagamentos e NF-e automatica',
    icon: Receipt,
  },
  { to: '/entregas', title: 'Entregas', description: 'Rotas, status e acerto por entregador', icon: Truck },
  { to: '/despesas', title: 'Despesas', description: 'Lancamentos e categorias', icon: Money },
  {
    to: '/financeiro',
    title: 'Financeiro',
    description: 'Contas a pagar e a receber',
    icon: Bank,
  },
  { to: '/estoque', title: 'Estoque', description: 'Itens e quantidades disponiveis', icon: Package },
  { to: '/caixa', title: 'Caixa', description: 'Entradas, saidas e saldo', icon: CashRegister },
  { to: '/dre', title: 'DRE', description: 'Receitas, despesas e resultado', icon: ChartLineUp },
] as const

export function DashboardPage() {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
        Jose Gestao Comercial
      </p>
      <PageHeader
        title="Painel inicial"
        description="Acesse os modulos do sistema. Vendas fecham com NF-e e baixa de estoque."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.to}
            to={module.to}
            title={module.title}
            description={module.description}
            icon={module.icon}
          />
        ))}
      </div>
    </div>
  )
}
