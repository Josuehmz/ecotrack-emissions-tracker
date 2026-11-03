import { supabase } from '../lib/supabaseClient.ts'
import type { EmissionsRepository } from '../types/emissions.ts'
import { createDemoRepository } from './demoRepository.ts'
import { createSupabaseRepository } from './emissionsService.ts'

/** Repositorio por defecto: Supabase si hay credenciales, si no el modo demo. */
export const defaultRepository: EmissionsRepository = supabase
  ? createSupabaseRepository(supabase)
  : createDemoRepository()
