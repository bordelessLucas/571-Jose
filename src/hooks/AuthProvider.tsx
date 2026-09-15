import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile } from '@/domain/types'
import { AppError } from '@/lib/errors'
import * as authService from '@/services/auth.service'

type AuthContextValue = {
  user: UserProfile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    if (error.message.includes('auth/invalid-credential')) {
      return 'E-mail ou senha inválidos.'
    }
    if (error.message.includes('auth/too-many-requests')) {
      return 'Muitas tentativas. Aguarde e tente novamente.'
    }
  }

  return 'Falha ao autenticar.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const profile = await authService.loginWithEmail(email, password)
      setUser(profile)
    } catch (err) {
      const message = mapAuthMessage(err)
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await authService.logout()
      setUser(null)
    } catch (err) {
      const message =
        err instanceof AppError ? err.message : 'Falha ao sair da conta.'
      setError(message)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo(
    () => ({ user, loading, error, login, logout, clearError }),
    [user, loading, error, login, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return context
}
