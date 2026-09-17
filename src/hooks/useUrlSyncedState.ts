import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useUrlSyncedState<T extends string>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = (searchParams.get(key) ?? fallback) as T

  const setValue = useCallback(
    (nextValue: T) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (nextValue === fallback || nextValue.trim() === '') {
            params.delete(key)
          } else {
            params.set(key, nextValue)
          }
          return params
        },
        { replace: true },
      )
    },
    [fallback, key, setSearchParams],
  )

  return [value, setValue]
}
