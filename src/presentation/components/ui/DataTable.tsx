import { useMemo, useState, type ReactNode, type UIEvent } from 'react'
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
  virtualizeThreshold?: number
}

const VIRTUAL_ROW_HEIGHT = 58
const VIRTUAL_VIEWPORT_HEIGHT = 520
const VIRTUAL_OVERSCAN = 8

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyTitle,
  emptyDescription,
  emptyAction,
  caption,
  virtualizeThreshold = 120,
}: DataTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const shouldVirtualize = rows.length > virtualizeThreshold
  const virtualRows = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        rows,
        beforeHeight: 0,
        afterHeight: 0,
      }
    }

    const visibleCount =
      Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN,
    )
    const endIndex = Math.min(rows.length, startIndex + visibleCount)

    return {
      rows: rows.slice(startIndex, endIndex),
      beforeHeight: startIndex * VIRTUAL_ROW_HEIGHT,
      afterHeight: Math.max(0, (rows.length - endIndex) * VIRTUAL_ROW_HEIGHT),
    }
  }, [rows, scrollTop, shouldVirtualize])

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    if (shouldVirtualize) {
      setScrollTop(event.currentTarget.scrollTop)
    }
  }

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
    <div
      className="overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={shouldVirtualize ? { maxHeight: VIRTUAL_VIEWPORT_HEIGHT } : undefined}
      onScroll={handleScroll}
    >
      <table className="min-w-full text-left text-sm">
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        <thead className="sticky top-0 bg-[var(--color-surface-muted)] text-[13px] font-medium text-[var(--color-text-muted)]">
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
          {virtualRows.beforeHeight > 0 ? (
            <tr aria-hidden="true">
              <td
                colSpan={columns.length}
                style={{ height: virtualRows.beforeHeight, padding: 0 }}
              />
            </tr>
          ) : null}

          {virtualRows.rows.map((row) => (
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

          {virtualRows.afterHeight > 0 ? (
            <tr aria-hidden="true">
              <td
                colSpan={columns.length}
                style={{ height: virtualRows.afterHeight, padding: 0 }}
              />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
