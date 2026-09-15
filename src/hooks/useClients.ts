import { useCallback, useEffect, useState } from 'react'
import type { Client, ClientInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as clientsService from '@/services/clients.service'

export function useClientMutations() {
  const create = useCallback(async (input: ClientInput) => {
    return clientsService.createClient(input)
  }, [])

  const update = useCallback(async (id: string, input: ClientInput) => {
    await clientsService.updateClient(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await clientsService.deleteClient(id)
  }, [])

  return { create, update, remove }
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useClientMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await clientsService.listClients()
      setClients(data)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao listar clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: ClientInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: ClientInput) => {
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

  return { clients, loading, error, refresh, create, update, remove }
}

export function useClient(id: string | undefined) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true

    void clientsService
      .getClientById(id)
      .then((data) => {
        if (active) {
          setClient(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setClient(null)
          setError(err instanceof AppError ? err.message : 'Erro ao carregar cliente.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return { client: null, loading: false, error: null }
  }

  return { client, loading, error }
}
