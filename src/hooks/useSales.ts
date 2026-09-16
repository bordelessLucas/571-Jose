import { useCallback, useEffect, useState } from 'react'
import type { ClientCommercialInsight, Sale, SaleInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as salesService from '@/services/sales.service'

export function useSaleMutations() {
  const create = useCallback(async (input: SaleInput) => {
    return salesService.createSale(input)
  }, [])

  const update = useCallback(async (id: string, input: SaleInput) => {
    await salesService.updateSale(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await salesService.deleteSale(id)
  }, [])

  const reemitNfe = useCallback(async (id: string) => {
    await salesService.reemitNfeForSale(id)
  }, [])

  return { create, update, remove, reemitNfe }
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useSaleMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await salesService.listSales()
      setSales(data)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao listar vendas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: SaleInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: SaleInput) => {
      await mutations.update(id, input)
      await refresh()
    },
    [mutations, refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await mutations.remove(id)
      await refresh()
    },
    [mutations, refresh],
  )

  return { sales, loading, error, refresh, create, update, remove }
}

export function useSale(id: string | undefined) {
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => {
    setReloadKey((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true
    setLoading(true)

    void salesService
      .getSaleById(id)
      .then((data) => {
        if (active) {
          setSale(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setSale(null)
          setError(err instanceof AppError ? err.message : 'Erro ao carregar venda.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id, reloadKey])

  if (!id) {
    return { sale: null, loading: false, error: null, refresh }
  }

  return { sale, loading, error, refresh }
}

export function useClientCommercialInsight(clientId: string | undefined) {
  const [insight, setInsight] = useState<ClientCommercialInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) {
      setInsight(null)
      setLoading(false)
      setError(null)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    void salesService
      .getClientCommercialInsight(clientId)
      .then((data) => {
        if (active) {
          setInsight(data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setInsight(null)
          setError(
            err instanceof AppError
              ? err.message
              : 'Erro ao carregar histórico do cliente.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [clientId])

  return { insight, loading, error }
}
