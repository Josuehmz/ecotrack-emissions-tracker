import { memo } from 'react'
import type { Emission, EmissionCategory } from '../types/emissions.ts'
import { formatCo2, formatCo2Spoken, formatDate } from '../utils/format.ts'

/** Badges con texto -800 sobre fondo -100: contraste mayor a 4,5:1 (WCAG AA). */
const CATEGORY_STYLES: Record<EmissionCategory, string> = {
  Transporte: 'bg-sky-100 text-sky-800 ring-sky-300',
  Energía: 'bg-amber-100 text-amber-900 ring-amber-300',
  Residuos: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
}

interface EmissionCardProps {
  readonly emission: Emission
}

/**
 * Tarjeta de una medición. memo: escribir en el formulario re-renderiza el
 * contenedor, pero las cards solo cambian si cambia su `emission`.
 */
export const EmissionCard = memo(function EmissionCard({ emission }: EmissionCardProps) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-medium break-words text-slate-900">{emission.sourceName}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_STYLES[emission.category]}`}
        >
          <span className="sr-only">Categoría: </span>
          {emission.category}
        </span>
      </header>

      <p className="text-3xl font-semibold tracking-tight text-slate-900">
        <span aria-hidden="true">
          {formatCo2(emission.co2Kg)}
          <span className="ml-1 text-sm font-normal text-slate-600">CO₂e</span>
        </span>
        <span className="sr-only">{formatCo2Spoken(emission.co2Kg)}</span>
      </p>

      <time dateTime={emission.measuredAt} className="mt-auto text-xs text-slate-600">
        {formatDate(emission.measuredAt)}
      </time>
    </article>
  )
})
