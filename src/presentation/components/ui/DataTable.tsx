import { type ReactNode } from 'react'
import { EmptyState } from '@/presentation/components/ui/EmptyState'

type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  caption?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyTitle,
  emptyDescription,
  emptyAction,
  caption,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    if (emptyAction || emptyTitle) {
      return (
        <EmptyState
          title={emptyTitle ?? emptyMessage}
          description={emptyDescription}
          action={emptyAction}
        />
      )
    }
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] px-3 py-2 text-[12px] text-[var(--color-text-muted)] sm:hidden">
        Role a tabela para ver todas as colunas.
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        <thead className="bg-[var(--color-surface-muted)] text-[13px] font-medium text-[var(--color-text-muted)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-2.5 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-t border-[var(--color-border)] transition-[background-color] duration-100 hover:bg-[var(--color-surface-muted)]/60"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-2.5 text-[var(--color-text)] ${
                    column.align === 'right'
                      ? 'text-right font-mono text-[14px] tabular-nums'
                      : ''
                  }`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  )
}
