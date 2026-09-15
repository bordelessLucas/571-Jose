import { useCallback, useEffect, useState } from 'react'
import type { Seller, SellerInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as sellersService from '@/services/sellers.service'

export function useSellerMutations() {
  const create = useCallback(async (input: SellerInput) => {
    return sellersService.createSeller(input)
  }, [])

  const update = useCallback(async (id: string, input: SellerInput) => {
    await sellersService.updateSeller(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await sellersService.deleteSeller(id)
  }, [])

  return { create, update, remove }
}

export function useSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useSellerMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await sellersService.listSellers()
      setSellers(data)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao listar vendedores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: SellerInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: SellerInput) => {
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

  return { sellers, loading, error, refresh, create, update, remove }
}

export function useSeller(id: string | undefined) {
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    void sellersService
      .getSellerById(id)
      .then((data) => {
        if (active) {
          setSeller(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setSeller(null)
          setError(
            err instanceof AppError ? err.message : 'Erro ao carregar vendedor.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return { seller: null, loading: false, error: null }
  }

  return { seller, loading, error }
}
