export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] motion-safe:animate-spin"
      />
      {label}
    </div>
  )
}
