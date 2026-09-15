import { useCallback, useEffect, useState } from 'react'
import type { InventoryItem, InventoryItemInput } from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as inventoryService from '@/services/inventory.service'

export function useInventoryMutations() {
  const create = useCallback(async (input: InventoryItemInput) => {
    return inventoryService.createInventoryItem(input)
  }, [])

  const update = useCallback(async (id: string, input: InventoryItemInput) => {
    await inventoryService.updateInventoryItem(id, input)
  }, [])

  const remove = useCallback(async (id: string) => {
    await inventoryService.deleteInventoryItem(id)
  }, [])

  return { create, update, remove }
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mutations = useInventoryMutations()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await inventoryService.listInventoryItems()
      setItems(data)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erro ao listar estoque.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: InventoryItemInput) => {
      const id = await mutations.create(input)
      await refresh()
      return id
    },
    [mutations, refresh],
  )

  const update = useCallback(
    async (id: string, input: InventoryItemInput) => {
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

  return { items, loading, error, refresh, create, update, remove }
}

export function useInventoryItem(id: string | undefined) {
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let active = true
    void inventoryService
      .getInventoryItemById(id)
      .then((data) => {
        if (active) {
          setItem(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setItem(null)
          setError(err instanceof AppError ? err.message : 'Erro ao carregar item.')
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (!id) {
    return { item: null, loading: false, error: null }
  }

  return { item, loading, error }
}
