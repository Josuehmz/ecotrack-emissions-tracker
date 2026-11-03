import type { Emission, EmissionCategory, EmissionsSummary } from '../types/emissions.ts'

/*
 * Funciones puras de presentación. Viven fuera de los componentes para que el
 * archivo de cada componente solo exporte componentes (Fast Refresh) y para
 * poder probarlas sin React.
 */

const co2Formatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

/** "1,24 t" o "612,25 kg": compacto, para mostrar. */
export function formatCo2(kg: number): string {
  return kg >= 1000 ? `${co2Formatter.format(kg / 1000)} t` : `${co2Formatter.format(kg)} kg`
}

/** "1,24 toneladas de CO2 equivalente": lo que lee un lector de pantalla. */
export function formatCo2Spoken(kg: number): string {
  return kg >= 1000
    ? `${co2Formatter.format(kg / 1000)} toneladas de CO2 equivalente`
    : `${co2Formatter.format(kg)} kilogramos de CO2 equivalente`
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** Total y desglose por categoría. Se memoriza en el componente con useMemo. */
export function summarizeEmissions(emissions: readonly Emission[]): EmissionsSummary {
  // Literal con las tres claves: si se agrega una categoría, el compilador obliga a sumarla aquí.
  const byCategory: Record<EmissionCategory, number> = { Transporte: 0, Energía: 0, Residuos: 0 }
  let totalKg = 0
  for (const e of emissions) {
    byCategory[e.category] += e.co2Kg
    totalKg += e.co2Kg
  }
  return { totalKg, count: emissions.length, byCategory }
}
