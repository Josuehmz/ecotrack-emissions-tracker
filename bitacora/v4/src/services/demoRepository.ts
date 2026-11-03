import { DEMO_SIMULATIONS } from '../types/emissions.ts'
import type { DemoSimulation, Emission, EmissionsRepository, NewEmission } from '../types/emissions.ts'

/*
 * MODO DEMO: repositorio en memoria con DATOS SIMULADOS.
 * Se usa cuando faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.
 * Tiene la misma interfaz que el servicio de Supabase y un retardo artificial
 * para que se vean el esqueleto de carga y el botón "Guardando…". Nada se
 * persiste: al recargar la página vuelven los datos iniciales.
 *
 * Con ?simular=… reproduce un caso para revisar la UI (nunca en modo Supabase):
 *   lento          la carga y el guardado tardan 4 s
 *   error-carga    la primera carga falla; "Reintentar" funciona
 *   error-guardado todo guardado falla con el mismo mensaje que daría RLS
 *   vacio          arranca sin mediciones
 */

const DEMO_SEED: readonly Emission[] = [
  { id: 'demo-1', sourceName: 'Flota de reparto Bogotá', category: 'Transporte', co2Kg: 1240.5, measuredAt: '2026-11-02T14:30:00Z' },
  { id: 'demo-2', sourceName: 'Planta de producción Medellín', category: 'Energía', co2Kg: 3875, measuredAt: '2026-11-02T09:00:00Z' },
  { id: 'demo-3', sourceName: 'Relleno sanitario sede Cali', category: 'Residuos', co2Kg: 612.25, measuredAt: '2026-11-01T18:15:00Z' },
  { id: 'demo-4', sourceName: 'Vuelos corporativos', category: 'Transporte', co2Kg: 2210, measuredAt: '2026-11-01T08:00:00Z' },
  { id: 'demo-5', sourceName: 'Centro de datos', category: 'Energía', co2Kg: 958.8, measuredAt: '2026-10-31T23:59:00Z' },
]

export const DEFAULT_DEMO_DELAY_MS = 700
const SLOW_DELAY_MS = 4000

/** Lee ?simular=… de la URL. Un valor desconocido se ignora (null). */
export function simulationFromSearch(search: string): DemoSimulation | null {
  const value = new URLSearchParams(search).get('simular')
  return DEMO_SIMULATIONS.find((s) => s === value) ?? null
}

interface DemoOptions {
  readonly delayMs?: number
  readonly simulation?: DemoSimulation | null
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createDemoRepository({ delayMs = DEFAULT_DEMO_DELAY_MS, simulation = null }: DemoOptions = {}): EmissionsRepository {
  let rows: Emission[] = simulation === 'vacio' ? [] : [...DEMO_SEED]
  let loadAttempts = 0
  const delay = simulation === 'lento' ? Math.max(delayMs, SLOW_DELAY_MS) : delayMs

  return {
    mode: 'demo',
    simulation,

    async list() {
      await wait(delay)
      loadAttempts++
      if (simulation === 'error-carga' && loadAttempts === 1) {
        throw new Error('No se pudo conectar con Supabase. Revisa tu conexión e inténtalo de nuevo. (simulado)')
      }
      return [...rows]
    },

    async insert(input: NewEmission) {
      await wait(delay)
      if (simulation === 'error-guardado') {
        throw new Error('No tienes permiso para esta operación (política RLS). (simulado)')
      }
      const created: Emission = { ...input, id: `demo-${crypto.randomUUID()}`, measuredAt: new Date().toISOString() }
      rows = [created, ...rows]
      return created
    },
  }
}
