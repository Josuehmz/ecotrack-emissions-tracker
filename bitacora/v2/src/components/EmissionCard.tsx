import type { Emission, EmissionCategory } from '../types/emissions.ts'

/** Clases de Tailwind por categoría. Record obliga a cubrir las tres. */
const CATEGORY_STYLES: Record<EmissionCategory, string> = {
  Transporte: 'bg-sky-100 text-sky-800 ring-sky-200',
  Energía: 'bg-amber-100 text-amber-800 ring-amber-200',
  Residuos: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
}

const co2Formatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export function formatCo2(kg: number): string {
  return kg >= 1000 ? `${co2Formatter.format(kg / 1000)} t` : `${co2Formatter.format(kg)} kg`
}

interface EmissionCardProps {
  emission: Emission
}

export function EmissionCard({ emission }: EmissionCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-slate-900">{emission.sourceName}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_STYLES[emission.category]}`}
        >
          {emission.category}
        </span>
      </header>

      <p className="text-3xl font-semibold tracking-tight text-slate-900">
        {formatCo2(emission.co2Kg)}
        <span className="ml-1 text-sm font-normal text-slate-500">CO₂e</span>
      </p>

      <time dateTime={emission.measuredAt} className="text-xs text-slate-500">
        {dateFormatter.format(new Date(emission.measuredAt))}
      </time>
    </article>
  )
}
