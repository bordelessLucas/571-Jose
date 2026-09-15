import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/AuthProvider'
import { Alert } from '@/presentation/components/ui/Alert'
import { Button } from '@/presentation/components/ui/Button'
import { Input } from '@/presentation/components/ui/Input'
import { Spinner } from '@/presentation/components/ui/Spinner'

export function LoginPage() {
  const { user, loading, login, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      // erro já tratado no hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--color-bg)] p-4">
      <form
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
      >
        <p className="text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
          José
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">
          Acesso ao sistema
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Entre com e-mail e senha para continuar.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
