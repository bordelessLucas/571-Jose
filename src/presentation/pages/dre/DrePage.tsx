import { useState } from 'react'
import { formatCurrency, todayInputValue } from '@/lib/format'
import { useDre } from '@/hooks/useDre'
import { useUrlSyncedState } from '@/hooks/useUrlSyncedState'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function DrePage() {
  const [urlFrom, setUrlFrom] = useUrlSyncedState<string>('from', '')
  const [urlTo, setUrlTo] = useUrlSyncedState<string>('to', '')
  const activePeriod = urlFrom && urlTo ? { from: urlFrom, to: urlTo } : null
  const { summary, loading, error, setPeriod, refresh } = useDre(activePeriod)
  const [from, setFrom] = useState(urlFrom)
  const [to, setTo] = useState(urlTo)

  function applyPeriod() {
    if (from && to) {
      setUrlFrom(from)
      setUrlTo(to)
      setPeriod({ from, to })
    } else {
      setUrlFrom('')
      setUrlTo('')
      setPeriod(null)
    }
  }

  function clearPeriod() {
    setFrom('')
    setTo('')
    setUrlFrom('')
    setUrlTo('')
    setPeriod(null)
  }

  const dreRows = summary
    ? [
        { label: 'Receita bruta', value: summary.receitas, level: 0 },
        { label: 'Deducoes', value: -summary.deducoes, level: 1 },
        {
          label: 'Receita liquida',
          value: summary.receitaLiquida,
          level: 0,
          strong: true,
        },
        { label: 'Custos', value: -summary.custos, level: 1 },
        {
          label: 'Lucro bruto',
          value: summary.lucroBruto,
          level: 0,
          strong: true,
        },
        {
          label: 'Despesas operacionais',
          value: -summary.despesasOperacionais,
          level: 1,
        },
        {
          label: 'Despesas administrativas',
          value: -summary.despesasAdministrativas,
          level: 1,
        },
        {
          label: 'Despesas comerciais',
          value: -summary.despesasComerciais,
          level: 1,
        },
        {
          label: 'Despesas financeiras',
          value: -summary.despesasFinanceiras,
          level: 1,
        },
        { label: 'Outras despesas', value: -summary.outrasDespesas, level: 1 },
        {
          label: 'Resultado liquido',
          value: summary.resultado,
          level: 0,
          strong: true,
        },
      ]
    : []

  return (
    <div>
      <PageHeader
        title="DRE gerencial"
        description="Receita bruta, deducoes, lucro bruto, despesas por categoria e resultado."
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
          label="Ate"
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
              Receita bruta ({summary.salesCount} vendas)
            </p>
            <p className="mt-1 font-mono text-xl tabular-nums text-[var(--color-success)]">
              {formatCurrency(summary.receitas)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Lucro bruto
            </p>
            <p className="mt-1 font-mono text-xl tabular-nums text-[var(--color-primary)]">
              {formatCurrency(summary.lucroBruto)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Resultado
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[var(--color-primary)]">
              {formatCurrency(summary.resultado)}
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                Estrutura da DRE
              </h2>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {summary.expensesCount} despesas no periodo
              </p>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {dreRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <span
                    className={`text-sm ${
                      row.level > 0
                        ? 'pl-4 text-[var(--color-text-muted)]'
                        : 'text-[var(--color-text)]'
                    } ${row.strong ? 'font-semibold' : ''}`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`font-mono text-sm tabular-nums ${
                      row.value < 0
                        ? 'text-[var(--color-danger)]'
                        : row.strong
                          ? 'font-semibold text-[var(--color-primary)]'
                          : 'text-[var(--color-text)]'
                    }`}
                  >
                    {formatCurrency(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
