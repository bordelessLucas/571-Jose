import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { ModuleCard } from '@/presentation/components/ui/ModuleCard'

export function FinanceHubPage() {
  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar e a receber. Recebíveis de vendas aparecem com o cliente vinculado."
        backTo="/"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <ModuleCard
          to="/financeiro/pagar"
          title="Contas a pagar"
          description="Cadastro, vencimento, status e consulta."
        />
        <ModuleCard
          to="/financeiro/receber"
          title="Contas a receber"
          description="Débitos de clientes, inclusive gerados pelas vendas."
        />
      </div>
    </div>
  )
}
