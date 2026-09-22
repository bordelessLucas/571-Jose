import { useEffect, useMemo, useRef, useState } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { Sale } from '@/domain/types'
import { FISCAL_STATUS_LABELS } from '@/domain/types'
import { formatCurrency, formatDate, todayInputValue } from '@/lib/format'
import { useSales } from '@/hooks/useSales'
import { useUrlSyncedState } from '@/hooks/useUrlSyncedState'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { ConfirmDialog } from '@/presentation/components/ui/ConfirmDialog'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { Input } from '@/presentation/components/ui/Input'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import {
  StatusBadge,
  fiscalStatusTone,
} from '@/presentation/components/ui/StatusBadge'

type ActionsMenuPosition = {
  top: number
  left: number
}

function matchesSaleFilter(sale: Sale, rawFilter: string): boolean {
  const filter = rawFilter.trim().toLowerCase()
  if (!filter) return true

  const haystack = [
    sale.clientName,
    sale.clientPhone,
    sale.clientAddress,
    sale.sellerName,
    sale.productName,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(filter)
}

export function SalesPage() {
  const { sales, loading, error, remove } = useSales()
  const [filter, setFilter] = useUrlSyncedState<string>('q', '')
  const [pendingDelete, setPendingDelete] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)
  const [actionsMenuPosition, setActionsMenuPosition] =
    useState<ActionsMenuPosition | null>(null)
  const actionsMenuRef = useRef<HTMLDivElement | null>(null)
  const actionsButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const filteredSales = useMemo(
    () => sales.filter((sale) => matchesSaleFilter(sale, filter)),
    [sales, filter],
  )

  const today = todayInputValue()

  useEffect(() => {
    if (!openActionsId) return undefined
    const activeActionsId = openActionsId

    function closeActionsMenu(event: MouseEvent) {
      const target = event.target as Node
      const button = actionsButtonRefs.current[activeActionsId]
      if (
        actionsMenuRef.current?.contains(target) ||
        button?.contains(target)
      ) {
        return
      }
      setOpenActionsId(null)
      setActionsMenuPosition(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenActionsId(null)
        setActionsMenuPosition(null)
      }
    }

    function closeOnViewportChange() {
      setOpenActionsId(null)
      setActionsMenuPosition(null)
    }

    document.addEventListener('mousedown', closeActionsMenu)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('scroll', closeOnViewportChange, true)

    return () => {
      document.removeEventListener('mousedown', closeActionsMenu)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [openActionsId])

  function toggleActionsMenu(row: Sale) {
    if (openActionsId === row.id) {
      setOpenActionsId(null)
      setActionsMenuPosition(null)
      return
    }

    const button = actionsButtonRefs.current[row.id]
    const rect = button?.getBoundingClientRect()
    if (!rect) return

    const menuWidth = 176
    const margin = 12
    setActionsMenuPosition({
      top: rect.bottom + 8,
      left: Math.min(
        Math.max(margin, rect.right - menuWidth),
        window.innerWidth - menuWidth - margin,
      ),
    })
    setOpenActionsId(row.id)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await remove(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Vendas"
        description="Histórico comercial com NF-e automática ao fechar a venda."
        showDashboard
        actions={
          <Link to="/vendas/nova">
            <Button>Nova venda</Button>
          </Link>
        }
        meta={
          !loading ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {filter.trim()
                ? `${filteredSales.length} de ${sales.length} vendas`
                : `${sales.length} vendas`}
            </p>
          ) : null
        }
      />

      <div className="mb-4 max-w-xl">
        <Input
          label="Filtrar por nome, endereço ou telefone"
          name="saleFilter"
          placeholder="Ex.: Maria, Rua A, 1199…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          autoComplete="off"
        />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={filteredSales}
          rowKey={(row) => row.id}
          caption="Lista de vendas"
          emptyTitle={
            filter.trim()
              ? 'Nenhuma venda para este filtro'
              : 'Nenhuma venda registrada'
          }
          emptyDescription={
            filter.trim()
              ? 'Ajuste o filtro ou limpe o campo para ver todas as vendas.'
              : 'Registre a primeira venda com cliente, produto e forma de pagamento.'
          }
          emptyAction={
            filter.trim() ? (
              <Button variant="secondary" onClick={() => setFilter('')}>
                Limpar filtro
              </Button>
            ) : (
              <Link to="/vendas/nova">
                <Button>Nova venda</Button>
              </Link>
            )
          }
          columns={[
            {
              key: 'soldAt',
              header: 'Data',
              render: (row) => formatDate(row.soldAt),
            },
            {
              key: 'client',
              header: 'Cliente',
              render: (row) => (
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.clientName}</p>
                  <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                    {[row.clientPhone, row.clientAddress]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
              ),
            },
            {
              key: 'product',
              header: 'Produto',
              render: (row) => row.productName || '—',
            },
            {
              key: 'seller',
              header: 'Vendedor',
              render: (row) => row.sellerName,
            },
            {
              key: 'amount',
              header: 'Valor',
              align: 'right',
              render: (row) => formatCurrency(row.amount),
            },
            {
              key: 'dueDate',
              header: 'Vencimento',
              render: (row) => {
                if (!row.dueDate) return '—'
                const overdue = row.dueDate < today
                return (
                  <span className={overdue ? 'text-[var(--color-danger)] font-medium' : ''}>
                    {formatDate(row.dueDate)}
                  </span>
                )
              },
            },
            {
              key: 'fiscal',
              header: 'NF-e',
              render: (row) =>
                row.fiscalStatus ? (
                  <StatusBadge
                    label={FISCAL_STATUS_LABELS[row.fiscalStatus]}
                    tone={fiscalStatusTone(row.fiscalStatus)}
                  />
                ) : (
                  <StatusBadge label="Não emitida" tone="muted" />
                ),
            },
            {
              key: 'actions',
              header: 'Ações',
              align: 'right',
              render: (row) => (
                <div className="flex min-w-[96px] justify-end">
                  <Button
                    ref={(element) => {
                      actionsButtonRefs.current[row.id] = element
                    }}
                    variant="secondary"
                    className="h-12 w-12 p-0"
                    aria-label={`Abrir acoes da venda de ${row.clientName}`}
                    aria-expanded={openActionsId === row.id}
                    onClick={() => toggleActionsMenu(row)}
                  >
                    <DotsThreeVertical size={28} weight="bold" aria-hidden />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : null}

      {openActionsId && actionsMenuPosition
        ? createPortal(
            <div
              ref={actionsMenuRef}
              className="fixed z-[1000] w-44 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-left shadow-[var(--shadow-panel)]"
              style={{
                top: actionsMenuPosition.top,
                left: actionsMenuPosition.left,
              }}
            >
              <Link
                to={`/vendas/${openActionsId}`}
                className="block rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                onClick={() => {
                  setOpenActionsId(null)
                  setActionsMenuPosition(null)
                }}
              >
                Visualizar
              </Link>
              <Link
                to={`/vendas/${openActionsId}/editar`}
                className="block rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                onClick={() => {
                  setOpenActionsId(null)
                  setActionsMenuPosition(null)
                }}
              >
                Editar
              </Link>
              <button
                type="button"
                className="block w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm font-medium text-[var(--color-danger)] hover:bg-red-50"
                onClick={() => {
                  const sale = sales.find((item) => item.id === openActionsId)
                  setOpenActionsId(null)
                  setActionsMenuPosition(null)
                  if (sale) setPendingDelete(sale)
                }}
              >
                Excluir
              </button>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir venda?"
        description={
          pendingDelete
            ? `A venda de ${pendingDelete.clientName} (${formatCurrency(pendingDelete.amount)}) será removida. Estoque será devolvido e a conta a receber pendente será cancelada.`
            : ''
        }
        confirmLabel="Excluir venda"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
        onConfirm={() => {
          void confirmDelete()
        }}
      />
    </div>
  )
}
