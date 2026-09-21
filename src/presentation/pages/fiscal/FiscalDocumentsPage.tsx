import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FISCAL_STATUS_LABELS } from '@/domain/types'
import type { FiscalDocument } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { listFiscalDocuments } from '@/services/fiscalDocuments.service'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { DataTable } from '@/presentation/components/ui/DataTable'
import { PageHeader } from '@/presentation/components/ui/PageHeader'
import { Spinner } from '@/presentation/components/ui/Spinner'
import {
  StatusBadge,
  fiscalStatusTone,
} from '@/presentation/components/ui/StatusBadge'

function documentTypeLabel(document: FiscalDocument): string {
  return document.documentType === 'nfce' ? 'NFC-e / Cupom' : 'NF-e'
}

export function FiscalDocumentsPage() {
  const [documents, setDocuments] = useState<FiscalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void listFiscalDocuments()
      .then((data) => {
        if (active) {
          setDocuments(data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof AppError
              ? err.message
              : 'Nao foi possivel carregar os documentos fiscais.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Documentos fiscais"
        description="NF-e, NFC-e, XML, DANFE e vinculo com vendas."
        showDashboard
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? <Spinner /> : null}

      {!loading ? (
        <DataTable
          rows={documents}
          rowKey={(row) => row.id}
          emptyTitle="Nenhum documento fiscal"
          emptyDescription="As NF-e e NFC-e emitidas pelo sistema aparecerao aqui."
          columns={[
            {
              key: 'createdAt',
              header: 'Emissao',
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              key: 'type',
              header: 'Tipo',
              render: (row) => documentTypeLabel(row),
            },
            {
              key: 'recipient',
              header: 'Cliente',
              render: (row) => row.recipientName || '-',
            },
            {
              key: 'amount',
              header: 'Valor',
              align: 'right',
              render: (row) => formatCurrency(row.amount),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <StatusBadge
                  label={FISCAL_STATUS_LABELS[row.status]}
                  tone={fiscalStatusTone(row.status)}
                />
              ),
            },
            {
              key: 'ref',
              header: 'Referencia',
              render: (row) => (
                <span className="font-mono text-[13px]">{row.focusRef}</span>
              ),
            },
            {
              key: 'actions',
              header: 'Acoes',
              align: 'right',
              render: (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Link to={`/vendas/${row.referenceId}`}>
                    <Button variant="ghost">Venda</Button>
                  </Link>
                  {row.pdfUrl ? (
                    <a href={row.pdfUrl} target="_blank" rel="noreferrer">
                      <Button variant="secondary">PDF</Button>
                    </a>
                  ) : null}
                  {row.xmlUrl ? (
                    <a href={row.xmlUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost">XML</Button>
                    </a>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  )
}
