import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { isEmissionCategory } from '../types/emissions.ts'
import type { Emission, EmissionsRepository, NewEmission } from '../types/emissions.ts'

/*
 * Acceso a la tabla public.emissions. Es el único archivo que conoce los nombres
 * de las columnas (snake_case); hacia arriba solo salen tipos de dominio.
 */

const TABLE = 'emissions'
const COLUMNS = 'id, source_name, category, co2_kg, measured_at'

/**
 * Convierte una fila cruda en Emission, o null si no es válida.
 * PostgREST devuelve `numeric` como string en algunos casos, por eso co2_kg
 * acepta number o string numérico.
 */
export function parseEmissionRow(row: unknown): Emission | null {
  if (typeof row !== 'object' || row === null) return null
  const r = row as Record<string, unknown>

  const co2 = typeof r.co2_kg === 'string' ? Number(r.co2_kg) : r.co2_kg
  if (
    typeof r.id !== 'string' ||
    typeof r.source_name !== 'string' ||
    typeof r.category !== 'string' ||
    !isEmissionCategory(r.category) ||
    typeof co2 !== 'number' ||
    !Number.isFinite(co2) ||
    typeof r.measured_at !== 'string'
  ) {
    return null
  }

  return {
    id: r.id,
    sourceName: r.source_name,
    category: r.category,
    co2Kg: co2,
    measuredAt: r.measured_at,
  }
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

      const rows: unknown[] = data ?? []
      // Una fila inválida se descarta en vez de romper toda la lista.
      return rows.map(parseEmissionRow).filter((e): e is Emission => e !== null)
    },

    async insert(input: NewEmission) {
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
