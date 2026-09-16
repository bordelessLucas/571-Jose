import { useState } from 'react'
import { formatCurrency, todayInputValue } from '@/lib/format'
import { useDre } from '@/hooks/useDre'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function DrePage() {
  const { summary, loading, error, period, setPeriod, refresh } = useDre(null)
  const [from, setFrom] = useState(period?.from ?? '')
  const [to, setTo] = useState(period?.to ?? '')

  function applyPeriod() {
    if (from && to) {
      setPeriod({ from, to })
    } else {
      setPeriod(null)
    }
  }

  function clearPeriod() {
    setFrom('')
    setTo('')
    setPeriod(null)
  }

  return (
    <div>
      <PageHeader
        title="DRE simplificada"
        description="Receitas (vendas), despesas e resultado do período."
        showDashboard
        actions={
          <Button variant="secondary" onClick={() => void refresh()}>
            Atualizar
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-end">
        <Input
          label="De"
          name="from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          max={todayInputValue()}
        />
        <Input
          label="Até"
          name="to"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          max={todayInputValue()}
        />
        <div className="flex gap-2">
          <Button onClick={applyPeriod}>Filtrar</Button>
          <Button variant="secondary" onClick={clearPeriod}>
            Limpar
          </Button>
        </div>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading && summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Receitas ({summary.salesCount} vendas)
            </p>
            <p className="mt-1 font-mono text-xl tabular-nums text-[var(--color-success)]">
              {formatCurrency(summary.receitas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Despesas ({summary.expensesCount} lançamentos)
            </p>
            <p className="mt-1 font-mono text-xl tabular-nums text-[var(--color-danger)]">
              {formatCurrency(summary.despesas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">Resultado</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--color-primary)]">
              {formatCurrency(summary.resultado)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
