export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div
      className="surface-panel inline-flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)]"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] shadow-[0_0_0_4px_rgb(15_76_92_/_0.06)] motion-safe:animate-spin"
      />
      {label}
    </div>
  )
}
