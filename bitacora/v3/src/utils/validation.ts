import { isEmissionCategory } from '../types/emissions.ts'
import type { EmissionFormErrors, EmissionFormValues, NewEmission } from '../types/emissions.ts'

/** Máximo que cabe en la columna co2_kg numeric(12, 2). */
export const MAX_CO2_KG = 9_999_999_999.99
export const MAX_SOURCE_NAME = 80

// "1.234,5" o "12.345.678": miles con punto (formato colombiano), decimales con coma.
const THOUSANDS_DOT = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/
// "1234,5", "1234.5" o "1234": un solo separador decimal, coma o punto.
const PLAIN = /^\d+(?:[.,]\d+)?$/

/**
 * Convierte el texto del campo CO2 en número, o null si no es un número válido.
 * Acepta un signo menos inicial para poder decir "no puede ser negativo" en vez
 * de "no es un número".
 *
 * Ambigüedad conocida: "1.500" se lee como mil quinientos (miles con punto),
 * que es la lectura habitual en Colombia.
 */
export function parseDecimal(raw: string): number | null {
  const text = raw.trim()
  const negative = text.startsWith('-')
  const digits = negative ? text.slice(1) : text

  let normalized: string
  if (THOUSANDS_DOT.test(digits)) normalized = digits.replaceAll('.', '').replace(',', '.')
  else if (PLAIN.test(digits)) normalized = digits.replace(',', '.')
  else return null

  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  return negative ? -value : value
}

export type ValidationResult =
  | { readonly ok: true; readonly value: NewEmission }
  | { readonly ok: false; readonly errors: EmissionFormErrors }

/** Validación pura del formulario: recibe los strings del formulario, devuelve datos o errores. */
export function validateEmissionForm(values: EmissionFormValues): ValidationResult {
  const sourceName = values.sourceName.trim()
  const co2Kg = parseDecimal(values.co2Kg)

  let sourceError: string | undefined
  if (sourceName.length === 0) sourceError = 'Escribe el nombre de la fuente.'
  else if (sourceName.length > MAX_SOURCE_NAME) sourceError = `Máximo ${MAX_SOURCE_NAME} caracteres.`

  const categoryError = isEmissionCategory(values.category) ? undefined : 'Elige una categoría válida.'

  let co2Error: string | undefined
  if (values.co2Kg.trim() === '') co2Error = 'Indica el CO₂ producido en kilogramos.'
  else if (co2Kg === null) co2Error = 'Debe ser un número, por ejemplo 1.234,5.'
  else if (co2Kg < 0) co2Error = 'No puede ser negativo.'
  else if (co2Kg > MAX_CO2_KG) co2Error = 'El valor es demasiado grande.'

  // Con exactOptionalPropertyTypes no se puede escribir { campo: undefined }: solo se agregan los que fallan.
  const errors: EmissionFormErrors = {
    ...(sourceError && { sourceName: sourceError }),
    ...(categoryError && { category: categoryError }),
    ...(co2Error && { co2Kg: co2Error }),
  }

  if (sourceError || categoryError || co2Error || co2Kg === null) return { ok: false, errors }
  return { ok: true, value: { sourceName, category: values.category, co2Kg } }
}

/** Devuelve los errores sin el del campo indicado (sin escribir undefined). */
export function withoutError(errors: EmissionFormErrors, field: keyof EmissionFormErrors): EmissionFormErrors {
  const { [field]: _removed, ...rest } = errors
  return rest
}
