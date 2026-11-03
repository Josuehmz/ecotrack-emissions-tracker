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

/** Guarda de tipo para valores que llegan sin tipo (formulario, BD). Sin casts. */
export function isEmissionCategory(value: unknown): value is EmissionCategory {
  return EMISSION_CATEGORIES.some((category) => category === value)
}

/** Una medición tal como la consume la interfaz. */
export interface Emission {
  /** Identificador único (uuid generado por la BD; en modo demo, `demo-…`). */
  readonly id: string
  /** Nombre de la fuente emisora, p. ej. "Flota de reparto Bogotá". */
  readonly sourceName: string
  readonly category: EmissionCategory
  /** CO2 equivalente producido, en kilogramos. Siempre >= 0. */
  readonly co2Kg: number
  /** Fecha y hora de la medición en ISO 8601 (UTC). La asigna la BD. */
  readonly measuredAt: string
}

/** Datos que el usuario aporta para crear una medición. El id y la fecha los asigna la BD. */
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

export type EmissionFormField = keyof EmissionFormValues

/**
 * Errores de validación por campo. Con exactOptionalPropertyTypes un campo sin
 * error se OMITE: `{ co2Kg: undefined }` no compila.
 */
export type EmissionFormErrors = { readonly [K in EmissionFormField]?: string }

/** Estado de la carga del listado. Empieza en 'loading': no hay un "idle" que pintar. */
export type LoadStatus = 'loading' | 'success' | 'error'

/** De dónde salen los datos: Supabase real o el repositorio en memoria (modo demo). */
export type DataMode = 'supabase' | 'demo'

/** Casos que el modo demo puede reproducir con ?simular=… (solo para revisar la UI). */
export const DEMO_SIMULATIONS = ['lento', 'error-carga', 'error-guardado', 'vacio'] as const
export type DemoSimulation = (typeof DEMO_SIMULATIONS)[number]

/**
 * Lo que el hook necesita de la capa de datos. Lo implementan el servicio de
 * Supabase y el repositorio demo, y en las pruebas un repositorio falso.
 * Los métodos lanzan Error con un mensaje ya legible para el usuario.
 */
export interface EmissionsRepository {
  readonly mode: DataMode
  /** Simulación activa en modo demo; siempre null con Supabase. */
  readonly simulation: DemoSimulation | null
  list(): Promise<Emission[]>
  insert(input: NewEmission): Promise<Emission>
}

/** Total y desglose por categoría, derivados de la lista. */
export interface EmissionsSummary {
  readonly totalKg: number
  readonly count: number
  readonly byCategory: Readonly<Record<EmissionCategory, number>>
}

/** Contrato del hook useEmissions. La UI se escribe contra él y no contra Supabase. */
export interface UseEmissionsResult {
  /** 'demo' cuando faltan las variables de Supabase; la UI lo avisa. */
  readonly mode: DataMode
  /** Simulación activa en modo demo (?simular=…); null si no hay. */
  readonly simulation: DemoSimulation | null
  /** Mediciones ya cargadas, de la más reciente a la más antigua. */
  readonly emissions: readonly Emission[]
  readonly status: LoadStatus
  /** Mensaje legible si la carga falló; null en otro caso. */
  readonly loadError: string | null
  /** true mientras hay una inserción en curso (deshabilita el botón). */
  readonly isSubmitting: boolean
  /** Mensaje legible si la última inserción falló; null en otro caso. */
  readonly submitError: string | null
  /** Inserta una medición. true si se guardó; false si falló o ya había otra en curso. */
  readonly addEmission: (input: NewEmission) => Promise<boolean>
  /** Vuelve a pedir el listado (botón "Reintentar"). El resultado llega por status. */
  readonly reload: () => void
  /** Limpia submitError cuando el usuario vuelve a editar el formulario. */
  readonly clearSubmitError: () => void
}
