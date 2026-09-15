import { useCallback, useEffect, useState } from 'react'
import type { Expense, ExpenseInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as expensesService from '@/services/expenses.service'

export function useExpenseMutations() {
  const create = useCallback(async (input: ExpenseInput) => {
    return expensesService.createExpense(input)
  }, [])

  const update = useCallback(async (id: string, input: ExpenseInput) => {
    await expensesService.updateExpense(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await expensesService.deleteExpense(id)
  }, [])

  return { create, update, remove }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useExpenseMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await expensesService.listExpenses()
      setExpenses(data)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao listar despesas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: ExpenseInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: ExpenseInput) => {
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

  return {
    expenses,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  }
}

export function useExpense(id: string | undefined) {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    void expensesService
      .getExpenseById(id)
      .then((data) => {
        if (active) {
          setExpense(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setExpense(null)
          setError(
            err instanceof AppError ? err.message : 'Erro ao carregar despesa.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return { expense: null, loading: false, error: null }
  }

  return { expense, loading, error }
}
