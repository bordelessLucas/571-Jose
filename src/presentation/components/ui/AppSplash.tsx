import { Receipt } from '@phosphor-icons/react'

type AppSplashProps = {
  label?: string
}

export function AppSplash({ label = 'Preparando sistema...' }: AppSplashProps) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="surface-panel app-enter w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white shadow-[0_16px_34px_rgb(15_76_92_/_0.22)]">
          <Receipt size={24} weight="duotone" aria-hidden />
        </div>
        <p className="mt-4 text-lg font-semibold text-[var(--color-text)]">
          Jose Gestao Comercial
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{label}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <span className="block h-full w-1/2 rounded-full bg-[var(--color-primary)] motion-safe:animate-[splash-progress_1.2s_var(--motion-ease)_infinite]" />
        </div>
      </div>
    </div>
  )
}
