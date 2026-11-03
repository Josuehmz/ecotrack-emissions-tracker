import { useMemo } from 'react'
import { useEmissions } from '../hooks/useEmissions.ts'
import type { DemoSimulation } from '../types/emissions.ts'
import { summarizeEmissions } from '../utils/format.ts'
import { EmissionCard } from './EmissionCard.tsx'
import { EmissionForm } from './EmissionForm.tsx'
import { EmissionsEmpty, EmissionsLoadError, EmissionsLoading } from './EmissionsStatus.tsx'
import { EmissionsSummary } from './EmissionsSummary.tsx'

const SIMULATION_LABELS: Record<DemoSimulation, string> = {
  lento: 'carga lenta (4 s)',
  'error-carga': 'la primera carga falla',
  'error-guardado': 'todo guardado falla',
  vacio: 'sin mediciones',
}

/*
 * Contenedor del dashboard. Toda la lógica de datos está en useEmissions():
 * este archivo no importa Supabase, ni lib/, ni services/ (lo vigila .oxlintrc.json).
 */
export default function EmissionsTracker() {
  const { mode, simulation, emissions, status, loadError, isSubmitting, submitError, addEmission, reload, clearSubmitError } =
    useEmissions()

  // Solo se recalcula cuando cambia la lista, no en cada tecla del formulario.
  const summary = useMemo(() => summarizeEmissions(emissions), [emissions])

  return (
    <section aria-labelledby="emissions-title" className="flex flex-col gap-6">
      {mode === 'demo' && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span aria-hidden="true">⚠</span>
          <span>
            <strong>Modo demo:</strong> no hay credenciales de Supabase. Los datos son simulados y se pierden al
            recargar la página.
            {simulation && (
              <>
                {' '}
                <strong>Simulación activa:</strong> {SIMULATION_LABELS[simulation]}.
              </>
            )}
          </span>
        </p>
      )}

      <h2 id="emissions-title" className="sr-only">
        Mediciones de emisiones
      </h2>

      <EmissionsSummary summary={summary} />

      <EmissionForm onAdd={addEmission} isSubmitting={isSubmitting} submitError={submitError} onEdit={clearSubmitError} />

      {status === 'loading' && <EmissionsLoading />}

      {status === 'error' && <EmissionsLoadError message={loadError ?? 'Error desconocido.'} onRetry={reload} />}

      {status === 'success' && emissions.length === 0 && <EmissionsEmpty />}

      {status === 'success' && emissions.length > 0 && (
        <ul aria-label="Mediciones registradas" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {emissions.map((emission) => (
            <li key={emission.id}>
              <EmissionCard emission={emission} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
