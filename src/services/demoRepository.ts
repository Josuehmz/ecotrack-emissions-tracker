import type { Emission, EmissionsRepository, NewEmission } from '../types/emissions.ts'

/*
 * MODO DEMO: repositorio en memoria con DATOS SIMULADOS.
 * Se usa cuando faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.
 * Tiene la misma interfaz que el servicio de Supabase y un retardo artificial
 * para que se vean el loader y el botón "Guardando…". Nada se persiste: al
 * recargar la página vuelven los datos iniciales.
 */

const DEMO_SEED: readonly Emission[] = [
  { id: 'demo-1', sourceName: 'Flota de reparto Bogotá', category: 'Transporte', co2Kg: 1240.5, measuredAt: '2026-11-02T14:30:00Z' },
  { id: 'demo-2', sourceName: 'Planta de producción Medellín', category: 'Energía', co2Kg: 3875, measuredAt: '2026-11-02T09:00:00Z' },
  { id: 'demo-3', sourceName: 'Relleno sanitario sede Cali', category: 'Residuos', co2Kg: 612.25, measuredAt: '2026-11-01T18:15:00Z' },
  { id: 'demo-4', sourceName: 'Vuelos corporativos', category: 'Transporte', co2Kg: 2210, measuredAt: '2026-11-01T08:00:00Z' },
  { id: 'demo-5', sourceName: 'Centro de datos', category: 'Energía', co2Kg: 958.8, measuredAt: '2026-10-31T23:59:00Z' },
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function createDemoRepository(delayMs = 700): EmissionsRepository {
  let rows: Emission[] = [...DEMO_SEED]

  return {
    mode: 'demo',

    async list() {
      await wait(delayMs)
      return [...rows]
    },

    async insert(input: NewEmission) {
      await wait(delayMs)
      const created: Emission = {
        ...input,
        id: `demo-${crypto.randomUUID()}`,
        measuredAt: new Date().toISOString(),
      }
      rows = [created, ...rows]
      return created
    },
  }
}
