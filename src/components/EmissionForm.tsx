import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EMISSION_CATEGORIES, isEmissionCategory } from '../types/emissions.ts'
import type { EmissionFormErrors, EmissionFormField, EmissionFormValues, NewEmission } from '../types/emissions.ts'
import { MAX_SOURCE_NAME, validateEmissionForm, withoutError } from '../utils/validation.ts'

const EMPTY_FORM: EmissionFormValues = { sourceName: '', category: 'Transporte', co2Kg: '' }

/** Orden visual de los campos: el foco va al primero que tenga error. */
const FIELD_ORDER: readonly EmissionFormField[] = ['sourceName', 'category', 'co2Kg']

interface EmissionFormProps {
  readonly onAdd: (input: NewEmission) => Promise<boolean>
  readonly isSubmitting: boolean
  readonly submitError: string | null
  readonly onEdit: () => void
}

const inputBase =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600'
const inputClass = (hasError: boolean) => `${inputBase} ${hasError ? 'border-red-500' : 'border-slate-300'}`

export function EmissionForm({ onAdd, isSubmitting, submitError, onEdit }: EmissionFormProps) {
  const [values, setValues] = useState<EmissionFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<EmissionFormErrors>({})
  const idPrefix = useId()
  const fieldRefs = useRef<Partial<Record<EmissionFormField, HTMLInputElement | HTMLSelectElement | null>>>({})

  const ids = {
    sourceName: `${idPrefix}-source`,
    category: `${idPrefix}-category`,
    co2Kg: `${idPrefix}-co2`,
  } satisfies Record<EmissionFormField, string>

  function update<K extends EmissionFormField>(field: K, value: EmissionFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => withoutError(prev, field))
    if (submitError) onEdit()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateEmissionForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      const firstInvalid = FIELD_ORDER.find((field) => result.errors[field] !== undefined)
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus()
      return
    }
    // Solo se limpia si se guardó; si falla, el usuario no pierde lo que escribió.
    const saved = await onAdd(result.value)
    if (saved) {
      setValues(EMPTY_FORM)
      setErrors({})
    }
  }

  /** Props ARIA de un campo: aria-describedby solo si hay error (exactOptionalPropertyTypes). */
  function a11y(field: EmissionFormField) {
    const error = errors[field]
    return error ? { 'aria-invalid': true, 'aria-describedby': `${ids[field]}-error` } : { 'aria-invalid': false }
  }

  function fieldError(field: EmissionFormField) {
    const error = errors[field]
    return error ? (
      <p id={`${ids[field]}-error`} className="text-xs font-medium text-red-700">
        {error}
      </p>
    ) : null
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${idPrefix}-title`}
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-start"
    >
      <h2 id={`${idPrefix}-title`} className="text-base font-semibold text-slate-900 sm:col-span-2 lg:col-span-4">
        Nueva medición
      </h2>

      <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
        <label htmlFor={ids.sourceName} className="text-sm font-medium text-slate-700">
          Fuente
        </label>
        <input
          ref={(el) => {
            fieldRefs.current.sourceName = el
          }}
          id={ids.sourceName}
          type="text"
          autoComplete="off"
          maxLength={MAX_SOURCE_NAME + 20}
          value={values.sourceName}
          onChange={(e) => update('sourceName', e.target.value)}
          placeholder="Ej. Caldera planta norte"
          className={inputClass(errors.sourceName !== undefined)}
          {...a11y('sourceName')}
        />
        {fieldError('sourceName')}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.category} className="text-sm font-medium text-slate-700">
          Categoría
        </label>
        <select
          ref={(el) => {
            fieldRefs.current.category = el
          }}
          id={ids.category}
          value={values.category}
          onChange={(e) => {
            const next = e.target.value
            if (isEmissionCategory(next)) update('category', next)
          }}
          className={inputClass(errors.category !== undefined)}
          {...a11y('category')}
        >
          {EMISSION_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {fieldError('category')}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.co2Kg} className="text-sm font-medium text-slate-700">
          CO₂ producido (kg)
        </label>
        <input
          ref={(el) => {
            fieldRefs.current.co2Kg = el
          }}
          id={ids.co2Kg}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={values.co2Kg}
          onChange={(e) => update('co2Kg', e.target.value)}
          placeholder="1.234,5"
          className={inputClass(errors.co2Kg !== undefined)}
          {...a11y('co2Kg')}
        />
        {fieldError('co2Kg')}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 lg:col-span-1 lg:mt-6"
      >
        {isSubmitting && (
          <span aria-hidden="true" className="size-4 animate-spin rounded-full motion-reduce:animate-none border-2 border-white border-t-transparent" />
        )}
        {isSubmitting ? 'Guardando…' : 'Agregar medición'}
      </button>

      {submitError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2 lg:col-span-4">
          {submitError}
        </p>
      )}
    </form>
  )
}
