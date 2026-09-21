import { useCallback, useEffect, useState } from 'react'
import type {
  AccountReceivable,
  AccountReceivableInput,
  FinancialStatus,
  ReceivablePaymentInput,
} from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as accountsReceivableService from '@/services/accountsReceivable.service'

export function useAccountReceivableMutations() {
  const create = useCallback(async (input: AccountReceivableInput) => {
    return accountsReceivableService.createAccountReceivable(input)
  }, [])

  const update = useCallback(async (id: string, input: AccountReceivableInput) => {
    await accountsReceivableService.updateAccountReceivable(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await accountsReceivableService.deleteAccountReceivable(id)
  }, [])

  const pay = useCallback(async (id: string, input: ReceivablePaymentInput) => {
    await accountsReceivableService.payAccountReceivable(id, input)
  }, [])

  return { create, update, remove, pay }
}

export function useAccountsReceivable(
  statusFilter: FinancialStatus | 'all' = 'all',
) {
  const [accounts, setAccounts] = useState<AccountReceivable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useAccountReceivableMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await accountsReceivableService.listAccountsReceivable()
      setAccounts(
        statusFilter === 'all'
          ? data
          : data.filter((item) => item.status === statusFilter),
      )
    } catch (err) {
      setError(
        err instanceof AppError
          ? err.message
          : 'Erro ao listar contas a receber.',
      )
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: AccountReceivableInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: AccountReceivableInput) => {
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

  const pay = useCallback(
    async (id: string, input: ReceivablePaymentInput) => {
      await mutations.pay(id, input)
      await refresh()
    },
    [mutations, refresh],
  )

  return { accounts, loading, error, refresh, create, update, remove, pay }
}

export function useAccountReceivable(id: string | undefined) {
  const [account, setAccount] = useState<AccountReceivable | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let active = true
    void accountsReceivableService
      .getAccountReceivableById(id)
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
