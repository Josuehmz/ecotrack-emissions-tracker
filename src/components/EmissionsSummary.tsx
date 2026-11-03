import { memo } from 'react'
import { EMISSION_CATEGORIES } from '../types/emissions.ts'
import type { EmissionsSummary as Summary } from '../types/emissions.ts'
import { formatCo2, formatCo2Spoken } from '../utils/format.ts'

interface EmissionsSummaryProps {
  readonly summary: Summary
  /** Mientras carga se muestra «—»: un «0 kg» haría creer que la empresa no emite nada. */
  readonly loading: boolean
}

/** Total y desglose por categoría. Recibe el resumen ya memorizado por el contenedor. */
export const EmissionsSummary = memo(function EmissionsSummary({ summary, loading }: EmissionsSummaryProps) {
  const value = (kg: number) =>
    loading ? (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">cargando</span>
      </>
    ) : (
      <>
        <span aria-hidden="true">{formatCo2(kg)}</span>
        <span className="sr-only">{formatCo2Spoken(kg)}</span>
      </>
    )

  return (
    <dl aria-busy={loading} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2 rounded-xl bg-slate-900 p-4 text-white sm:col-span-1">
        <dt className="text-xs font-medium tracking-wide text-slate-300 uppercase">Total</dt>
        <dd className="mt-1 text-2xl font-semibold">
          {value(summary.totalKg)}
          {!loading && <span aria-hidden="true"> CO₂e</span>}
        </dd>
        <dd className="text-xs text-slate-300">
          {loading ? 'Cargando…' : `${summary.count} ${summary.count === 1 ? 'fuente registrada' : 'fuentes registradas'}`}
        </dd>
      </div>
      {EMISSION_CATEGORIES.map((category) => (
        <div key={category} className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-medium tracking-wide text-slate-600 uppercase">{category}</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">
            {value(summary.byCategory[category])}
          </dd>
        </div>
      ))}
    </dl>
  )
})
