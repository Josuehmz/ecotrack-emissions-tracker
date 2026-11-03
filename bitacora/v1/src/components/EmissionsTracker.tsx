import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { EMISSION_CATEGORIES, isEmissionCategory } from '../types/emissions.ts'
import type {
  Emission,
  EmissionCategory,
  EmissionFormErrors,
  EmissionFormValues,
  NewEmission,
} from '../types/emissions.ts'

/*
 * Primera versión (paso 1, solo arquitectura): los datos viven en useState con
 * mediciones de ejemplo. En el siguiente paso este estado se reemplaza por
 * useEmissions() y este archivo NO importa Supabase en ningún momento.
 *
 * EmissionCard y EmissionForm están en el mismo archivo para que la primera
 * versión se lea de una sola vez; se extraen a components/ cuando entre el hook.
 */

// ---------------------------------------------------------------------------
// Datos de ejemplo
// ---------------------------------------------------------------------------

const SAMPLE_EMISSIONS: readonly Emission[] = [
  {
    id: 'sample-1',
    sourceName: 'Flota de reparto Bogotá',
    category: 'Transporte',
    co2Kg: 1240.5,
    measuredAt: '2026-11-02T14:30:00Z',
  },
  {
    id: 'sample-2',
    sourceName: 'Planta de producción Medellín',
    category: 'Energía',
    co2Kg: 3875,
    measuredAt: '2026-11-02T09:00:00Z',
  },
  {
    id: 'sample-3',
    sourceName: 'Relleno sanitario sede Cali',
    category: 'Residuos',
    co2Kg: 612.25,
    measuredAt: '2026-11-01T18:15:00Z',
  },
  {
    id: 'sample-4',
    sourceName: 'Vuelos corporativos',
    category: 'Transporte',
    co2Kg: 2210,
    measuredAt: '2026-11-01T08:00:00Z',
  },
  {
    id: 'sample-5',
    sourceName: 'Centro de datos',
    category: 'Energía',
    co2Kg: 958.8,
    measuredAt: '2026-10-31T23:59:00Z',
  },
]

// ---------------------------------------------------------------------------
// Presentación
// ---------------------------------------------------------------------------

/** Clases de Tailwind por categoría. Record obliga a cubrir las tres. */
const CATEGORY_STYLES: Record<EmissionCategory, string> = {
  Transporte: 'bg-sky-100 text-sky-800 ring-sky-200',
  Energía: 'bg-amber-100 text-amber-800 ring-amber-200',
  Residuos: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
}

const co2Formatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatCo2(kg: number): string {
  return kg >= 1000 ? `${co2Formatter.format(kg / 1000)} t` : `${co2Formatter.format(kg)} kg`
}

// ---------------------------------------------------------------------------
// Validación del formulario (pura: recibe strings, devuelve datos o errores)
// ---------------------------------------------------------------------------

const EMPTY_FORM: EmissionFormValues = { sourceName: '', category: 'Transporte', co2Kg: '' }

type ValidationResult =
  | { ok: true; value: NewEmission }
  | { ok: false; errors: EmissionFormErrors }

function validateForm(values: EmissionFormValues): ValidationResult {
  const errors: EmissionFormErrors = {}
  const sourceName = values.sourceName.trim()
  // Acepta coma decimal, habitual en Colombia.
  const co2Kg = Number(values.co2Kg.replace(',', '.'))

  if (sourceName.length === 0) errors.sourceName = 'Escribe el nombre de la fuente.'
  else if (sourceName.length > 80) errors.sourceName = 'Máximo 80 caracteres.'

  if (!isEmissionCategory(values.category)) errors.category = 'Elige una categoría válida.'

  if (values.co2Kg.trim() === '') errors.co2Kg = 'Indica el CO2 producido.'
  else if (!Number.isFinite(co2Kg)) errors.co2Kg = 'Debe ser un número.'
  else if (co2Kg < 0) errors.co2Kg = 'No puede ser negativo.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: { sourceName, category: values.category, co2Kg } }
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

interface EmissionCardProps {
  emission: Emission
}

function EmissionCard({ emission }: EmissionCardProps) {
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

interface EmissionFormProps {
  onAdd: (input: NewEmission) => void
}

function EmissionForm({ onAdd }: EmissionFormProps) {
  const [values, setValues] = useState<EmissionFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<EmissionFormErrors>({})
  const idPrefix = useId()

  function update<K extends keyof EmissionFormValues>(field: K, value: EmissionFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Borra el error del campo apenas el usuario lo corrige.
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onAdd(result.value)
    setValues(EMPTY_FORM)
    setErrors({})
  }

  const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-emerald-500'
  const inputClass = (hasError: boolean) =>
    `${inputBase} ${hasError ? 'border-red-400' : 'border-slate-300'}`

  const nameId = `${idPrefix}-source`
  const categoryId = `${idPrefix}-category`
  const co2Id = `${idPrefix}-co2`

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Nueva medición"
      className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
        <label htmlFor={nameId} className="text-sm font-medium text-slate-700">
          Fuente
        </label>
        <input
          id={nameId}
          type="text"
          value={values.sourceName}
          onChange={(e) => update('sourceName', e.target.value)}
          placeholder="Ej. Caldera planta norte"
          aria-invalid={errors.sourceName !== undefined}
          aria-describedby={errors.sourceName ? `${nameId}-error` : undefined}
          className={inputClass(errors.sourceName !== undefined)}
        />
        {errors.sourceName && (
          <p id={`${nameId}-error`} className="text-xs text-red-600">
            {errors.sourceName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={categoryId} className="text-sm font-medium text-slate-700">
          Categoría
        </label>
        <select
          id={categoryId}
          value={values.category}
          onChange={(e) => {
            const next = e.target.value
            if (isEmissionCategory(next)) update('category', next)
          }}
          className={inputClass(errors.category !== undefined)}
        >
          {EMISSION_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={co2Id} className="text-sm font-medium text-slate-700">
          CO₂ (kg)
        </label>
        <input
          id={co2Id}
          type="text"
          inputMode="decimal"
          value={values.co2Kg}
          onChange={(e) => update('co2Kg', e.target.value)}
          placeholder="0,00"
          aria-invalid={errors.co2Kg !== undefined}
          aria-describedby={errors.co2Kg ? `${co2Id}-error` : undefined}
          className={inputClass(errors.co2Kg !== undefined)}
        />
        {errors.co2Kg && (
          <p id={`${co2Id}-error`} className="text-xs text-red-600">
            {errors.co2Kg}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-1"
      >
        Agregar medición
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function EmissionsTracker() {
  // Paso 1: estado local. Paso 2: const { emissions, ... } = useEmissions()
  const [emissions, setEmissions] = useState<readonly Emission[]>(SAMPLE_EMISSIONS)

  function handleAdd(input: NewEmission) {
    const created: Emission = {
      ...input,
      id: crypto.randomUUID(),
      measuredAt: new Date().toISOString(),
    }
    // La más reciente primero, igual que ordenará la consulta a la BD.
    setEmissions((prev) => [created, ...prev])
  }

  const totalKg = emissions.reduce((sum, e) => sum + e.co2Kg, 0)

  return (
    <section aria-labelledby="emissions-title" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="emissions-title" className="text-lg font-semibold text-slate-900">
            Mediciones
          </h2>
          <p className="text-sm text-slate-500">
            {emissions.length} {emissions.length === 1 ? 'fuente registrada' : 'fuentes registradas'}
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{formatCo2(totalKg)} CO₂e</span>
        </p>
      </header>

      <EmissionForm onAdd={handleAdd} />

      {emissions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Todavía no hay mediciones. Agrega la primera con el formulario.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emissions.map((emission) => (
            <li key={emission.id}>
              <EmissionCard emission={emission} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
