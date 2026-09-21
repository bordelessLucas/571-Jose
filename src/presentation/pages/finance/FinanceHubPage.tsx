import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { ModuleCard } from '@/presentation/components/ui/ModuleCard'

export function FinanceHubPage() {
  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar e a receber. Recebiveis de vendas aparecem com o cliente vinculado."
        backTo="/"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ModuleCard
          to="/financeiro/pagar"
          title="Contas a pagar"
          description="Cadastro, vencimento, status e consulta."
          icon={ArrowUp}
        />
        <ModuleCard
          to="/financeiro/receber"
          title="Contas a receber"
          description="Debitos de clientes, inclusive gerados pelas vendas."
          icon={ArrowDown}
        />
      </div>
    </div>
  )
}
