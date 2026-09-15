import { useCallback, useEffect, useState } from 'react'
import type {
  AccountPayable,
  AccountPayableInput,
  FinancialStatus,
} from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as accountsPayableService from '@/services/accountsPayable.service'

export function useAccountPayableMutations() {
  const create = useCallback(async (input: AccountPayableInput) => {
    return accountsPayableService.createAccountPayable(input)
  }, [])

  const update = useCallback(async (id: string, input: AccountPayableInput) => {
    await accountsPayableService.updateAccountPayable(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await accountsPayableService.deleteAccountPayable(id)
  }, [])

  return { create, update, remove }
}

export function useAccountsPayable(statusFilter: FinancialStatus | 'all' = 'all') {
  const [accounts, setAccounts] = useState<AccountPayable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useAccountPayableMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await accountsPayableService.listAccountsPayable()
      setAccounts(
        statusFilter === 'all'
          ? data
          : data.filter((item) => item.status === statusFilter),
      )
    } catch (err) {
      setError(
        err instanceof AppError ? err.message : 'Erro ao listar contas a pagar.',
      )
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: AccountPayableInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: AccountPayableInput) => {
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

  return { accounts, loading, error, refresh, create, update, remove }
}

export function useAccountPayable(id: string | undefined) {
  const [account, setAccount] = useState<AccountPayable | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let active = true
    void accountsPayableService
      .getAccountPayableById(id)
      .then((data) => {
        if (active) {
          setAccount(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setAccount(null)
          setError(err instanceof AppError ? err.message : 'Erro ao carregar conta.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return { account: null, loading: false, error: null }
  }

  return { account, loading, error }
}
