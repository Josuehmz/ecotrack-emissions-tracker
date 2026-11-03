import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { EMISSION_CATEGORIES, isEmissionCategory } from '../types/emissions.ts'
import type { EmissionFormErrors, EmissionFormValues, NewEmission } from '../types/emissions.ts'

const EMPTY_FORM: EmissionFormValues = { sourceName: '', category: 'Transporte', co2Kg: '' }

type ValidationResult = { ok: true; value: NewEmission } | { ok: false; errors: EmissionFormErrors }

function validateForm(values: EmissionFormValues): ValidationResult {
  const errors: EmissionFormErrors = {}
  const sourceName = values.sourceName.trim()
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

interface EmissionFormProps {
  onAdd: (input: NewEmission) => Promise<boolean>
  isSubmitting: boolean
  submitError: string | null
  onEdit: () => void
}

export function EmissionForm({ onAdd, isSubmitting, submitError, onEdit }: EmissionFormProps) {
  const [values, setValues] = useState<EmissionFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<EmissionFormErrors>({})
  const idPrefix = useId()

  function update<K extends keyof EmissionFormValues>(field: K, value: EmissionFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    if (submitError) onEdit()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    // Solo se limpia si se guardó; si falla, el usuario no pierde lo que escribió.
    const saved = await onAdd(result.value)
    if (saved) {
      setValues(EMPTY_FORM)
      setErrors({})
    }
  }

  const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 focus:ring-emerald-500'
  const inputClass = (hasError: boolean) => `${inputBase} ${hasError ? 'border-red-400' : 'border-slate-300'}`

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
        disabled={isSubmitting}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-1"
      >
        {isSubmitting ? 'Guardando…' : 'Agregar medición'}
      </button>

      {submitError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2 lg:col-span-4">
          {submitError}
        </p>
      )}
    </form>
  )
}
