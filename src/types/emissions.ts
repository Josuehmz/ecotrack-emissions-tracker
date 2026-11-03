/**
 * Tipos de dominio del Dashboard de Emisiones de EcoTrack.
 *
 * Este archivo no importa nada: ni React ni Supabase. Lo usan por igual la UI
 * (components/), el hook (hooks/) y la capa de datos (services/), y es el único
 * contrato que comparten.
 *
 * Con "erasableSyntaxOnly" no se pueden usar `enum`: las categorías se definen
 * como una tupla `as const` y el tipo se deriva de ella, así la lista para el
 * <select> y el tipo nunca se desincronizan.
 */

/** Categorías admitidas. El orden es el que se muestra en el formulario. */
export const EMISSION_CATEGORIES = ['Transporte', 'Energía', 'Residuos'] as const

/** 'Transporte' | 'Energía' | 'Residuos' */
export type EmissionCategory = (typeof EMISSION_CATEGORIES)[number]

/** Guarda de tipo para validar valores que llegan como string (formulario, BD). */
export function isEmissionCategory(value: string): value is EmissionCategory {
  return (EMISSION_CATEGORIES as readonly string[]).includes(value)
}

/** Una medición tal como la consume la interfaz. */
export interface Emission {
  /** Identificador único (uuid generado por la BD; en local, crypto.randomUUID()). */
  readonly id: string
  /** Nombre de la fuente emisora, p. ej. "Flota de reparto Bogotá". */
  readonly sourceName: string
  readonly category: EmissionCategory
  /** CO2 equivalente producido, en kilogramos. Siempre >= 0. */
  readonly co2Kg: number
  /** Fecha y hora de la medición en ISO 8601 (UTC). */
  readonly measuredAt: string
}

/**
 * Datos que el usuario aporta para crear una medición.
 * El id y la fecha los asigna el sistema (la BD en el siguiente paso).
 */
export type NewEmission = Pick<Emission, 'sourceName' | 'category' | 'co2Kg'>

/**
 * Valores crudos del formulario: todo es string mientras el usuario escribe.
 * Se convierten a NewEmission solo después de validar.
 */
export interface EmissionFormValues {
  sourceName: string
  category: EmissionCategory
  co2Kg: string
}

/** Errores de validación por campo; un campo sin error no aparece. */
export type EmissionFormErrors = Partial<Record<keyof EmissionFormValues, string>>

/**
 * Forma de la fila en la tabla `emissions` de Supabase (snake_case).
 * Solo la usa services/; la UI nunca la ve. El mapeo fila -> Emission vive
 * en un único lugar (services/emissionsService.ts) en el siguiente paso.
 */
export interface EmissionRow {
  id: string
  source_name: string
  category: string
  co2_kg: number
  measured_at: string
}

/** Estado de la carga inicial del listado. */
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

/** De dónde salen los datos: Supabase real o el repositorio en memoria (modo demo). */
export type DataMode = 'supabase' | 'demo'

/**
 * Lo que el hook necesita de la capa de datos. Lo implementan el servicio de
 * Supabase y el repositorio demo, y en las pruebas un repositorio falso.
 * Los métodos lanzan Error con un mensaje ya legible para el usuario.
 */
export interface EmissionsRepository {
  readonly mode: DataMode
  list(): Promise<Emission[]>
  insert(input: NewEmission): Promise<Emission>
}

/**
 * Contrato que expondrá el hook useEmissions en el siguiente paso.
 * Se declara ya para que la UI se escriba contra él y no contra Supabase.
 */
export interface UseEmissionsResult {
  /** 'demo' cuando faltan las variables de Supabase; la UI lo avisa. */
  mode: DataMode
  /** Mediciones ya cargadas, de la más reciente a la más antigua. */
  emissions: readonly Emission[]
  /** Estado de la carga del listado. */
  status: LoadStatus
  /** Mensaje legible si la carga falló; null en otro caso. */
  loadError: string | null
  /** true mientras hay una inserción en curso (deshabilita el botón). */
  isSubmitting: boolean
  /** Mensaje legible si la última inserción falló; null en otro caso. */
  submitError: string | null
  /** Inserta una medición. Resuelve true si se guardó. */
  addEmission: (input: NewEmission) => Promise<boolean>
  /** Vuelve a pedir el listado (botón "Reintentar"). */
  reload: () => Promise<void>
  /** Limpia submitError cuando el usuario vuelve a editar el formulario. */
  clearSubmitError: () => void
}
