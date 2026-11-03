interface LoadErrorProps {
  readonly message: string
  readonly onRetry: () => void
}

/** Esqueleto de carga. <output> tiene role="status" implícito y se anuncia de forma educada. */
export function EmissionsLoading() {
  return (
    <output aria-live="polite" className="block">
      <span className="sr-only">Cargando mediciones…</span>
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex animate-pulse flex-col motion-reduce:animate-none gap-3 rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-8 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
          </li>
        ))}
      </ul>
    </output>
  )
}

/** Error de carga con reintento. role="alert" lo anuncia apenas aparece. */
export function EmissionsLoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-medium text-red-800">No se pudieron cargar las mediciones.</p>
      <p className="text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        Reintentar
      </button>
    </div>
  )
}

export function EmissionsEmpty() {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
      Todavía no hay mediciones. Agrega la primera con el formulario.
    </p>
  )
}
