import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { isEmissionCategory } from '../types/emissions.ts'
import type { Emission, EmissionsRepository, NewEmission } from '../types/emissions.ts'

/*
 * Acceso a la tabla public.emissions. Es el único archivo que conoce los nombres
 * de las columnas (snake_case); hacia arriba solo salen tipos de dominio.
 */

const TABLE = 'emissions'
const COLUMNS = 'id, source_name, category, co2_kg, measured_at'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** numeric de Postgres puede llegar por PostgREST como number o como string. */
function toNumber(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Convierte una fila cruda en Emission, o null si no es válida. Estrecha tipos sin casts. */
export function parseEmissionRow(row: unknown): Emission | null {
  if (!isRecord(row)) return null
  const { id, source_name, category, measured_at } = row
  const co2Kg = toNumber(row.co2_kg)

  if (typeof id !== 'string' || typeof source_name !== 'string' || typeof measured_at !== 'string') return null
  if (!isEmissionCategory(category) || co2Kg === null || co2Kg < 0) return null

  return { id, sourceName: source_name, category, co2Kg, measuredAt: measured_at }
}

/** Traduce un error de Supabase a un mensaje para el usuario. */
export function toUserMessage(error: Pick<PostgrestError, 'message' | 'code'>): string {
  if (error.code === '42501') return 'No tienes permiso para esta operación (política RLS).'
  if (error.code === '23514') return 'Los datos no cumplen las reglas de la tabla.'
  if (error.message.includes('Failed to fetch')) {
    return 'No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo.'
  }
  return `Error de Supabase: ${error.message}`
}

export function createSupabaseRepository(client: SupabaseClient): EmissionsRepository {
  return {
    mode: 'supabase',

    async list() {
      const { data, error } = await client
        .from(TABLE)
        .select(COLUMNS)
        .order('measured_at', { ascending: false })
      if (error) throw new Error(toUserMessage(error))

      const rows: readonly unknown[] = data ?? []
      // Una fila inválida se descarta en vez de romper toda la lista.
      return rows.map(parseEmissionRow).filter((e): e is Emission => e !== null)
    },

    async insert(input: NewEmission) {
      // Solo las columnas que el usuario aporta: id y measured_at los pone la BD.
      const { data, error } = await client
        .from(TABLE)
        .insert({ source_name: input.sourceName, category: input.category, co2_kg: input.co2Kg })
        .select(COLUMNS)
        .single()
      if (error) throw new Error(toUserMessage(error))

      const created = parseEmissionRow(data)
      if (!created) throw new Error('La base de datos devolvió una fila con un formato inesperado.')
      return created
    },
  }
}
