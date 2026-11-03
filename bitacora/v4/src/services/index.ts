import { supabase } from '../lib/supabaseClient.ts'
import type { EmissionsRepository } from '../types/emissions.ts'
import { createDemoRepository, simulationFromSearch } from './demoRepository.ts'
import { createSupabaseRepository } from './emissionsService.ts'

/**
 * Repositorio por defecto: Supabase si hay credenciales; si no, el modo demo.
 * ?simular=… solo se lee en modo demo: con Supabase no tiene ningún efecto.
 */
export const defaultRepository: EmissionsRepository = supabase
  ? createSupabaseRepository(supabase)
  : createDemoRepository({ simulation: simulationFromSearch(window.location.search) })
