import { useCallback, useEffect, useState } from 'react'
import type { DrePeriodFilter, DreSummary } from '@/domain/types'
import { AppError } from '@/lib/errors'
import { getDreSummary } from '@/services/dre.service'

export function useDre(initialPeriod: DrePeriodFilter | null = null) {
  const [period, setPeriod] = useState<DrePeriodFilter | null>(initialPeriod)
  const [summary, setSummary] = useState<DreSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDreSummary(period)
      setSummary(data)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao calcular DRE.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { summary, loading, error, period, setPeriod, refresh }
}
