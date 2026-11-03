import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/*
 * Único lugar que crea el cliente de Supabase. Solo lo importa services/.
 *
 * Las credenciales llegan por variables de entorno de Vite (archivo .env, que no
 * se sube al repositorio; ver .env.example). Solo se usa la anon key: la
 * service_role nunca va en el frontend.
 *
 * Si falta alguna variable no se lanza un error: se exporta null y la app
 * arranca en "modo demo" con datos simulados.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
