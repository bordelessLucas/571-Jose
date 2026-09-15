import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Volta para a tela anterior do histórico.
 * Se não houver histórico útil, usa o fallback do módulo.
 */
export function useSmartBack(fallbackPath: string) {
  const navigate = useNavigate()

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      void navigate(-1)
      return
    }
    void navigate(fallbackPath)
  }, [fallbackPath, navigate])

  const goDashboard = useCallback(() => {
    void navigate('/')
  }, [navigate])

  return { goBack, goDashboard }
}
