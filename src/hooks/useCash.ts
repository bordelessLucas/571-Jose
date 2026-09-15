import { useCallback, useEffect, useState } from 'react'
import type {
  CashBalanceSummary,
  CashMovement,
  CashMovementInput,
} from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as cashService from '@/services/cash.service'

export function useCashMutations() {
  const create = useCallback(async (input: CashMovementInput) => {
    return cashService.createCashMovement(input)
  }, [])

  const update = useCallback(async (id: string, input: CashMovementInput) => {
    await cashService.updateCashMovement(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await cashService.deleteCashMovement(id)
  }, [])

  return { create, update, remove }
}

export function useCash() {
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [balance, setBalance] = useState<CashBalanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useCashMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cashService.listCashMovements()
      setMovements(data)
      setBalance(cashService.calculateCashBalance(data))
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao carregar o caixa.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: CashMovementInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: CashMovementInput) => {
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

  return { movements, balance, loading, error, refresh, create, update, remove }
}

export function useCashMovement(id: string | undefined) {
  const [movement, setMovement] = useState<CashMovement | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let active = true
    void cashService
      .getCashMovementById(id)
      .then((data) => {
        if (active) {
          setMovement(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setMovement(null)
          setError(
            err instanceof AppError ? err.message : 'Erro ao carregar movimentação.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return { movement: null, loading: false, error: null }
  }

  return { movement, loading, error }
}
