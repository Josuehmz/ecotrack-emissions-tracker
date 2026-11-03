import { useEmissions } from '../hooks/useEmissions.ts'
import { EmissionCard, formatCo2 } from './EmissionCard.tsx'
import { EmissionForm } from './EmissionForm.tsx'

/*
 * Contenedor del dashboard. Toda la lógica de datos está en useEmissions():
 * este archivo no importa Supabase, ni lib/, ni services/.
 */
export default function EmissionsTracker() {
  const { mode, emissions, status, loadError, isSubmitting, submitError, addEmission, reload, clearSubmitError } =
    useEmissions()

  const totalKg = emissions.reduce((sum, e) => sum + e.co2Kg, 0)

  return (
    <section aria-labelledby="emissions-title" className="flex flex-col gap-6">
      {mode === 'demo' && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <strong>Modo demo:</strong> no hay credenciales de Supabase, los datos son simulados y no se guardan.
        </p>
      )}

      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="emissions-title" className="text-lg font-semibold text-slate-900">
            Mediciones
          </h2>
          <p className="text-sm text-slate-500">
            {emissions.length} {emissions.length === 1 ? 'fuente registrada' : 'fuentes registradas'}
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{formatCo2(totalKg)} CO₂e</span>
        </p>
      </header>

      <EmissionForm
        onAdd={addEmission}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onEdit={clearSubmitError}
      />

      {(status === 'idle' || status === 'loading') && (
        <p className="p-10 text-center text-sm text-slate-500">Cargando mediciones…</p>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {status === 'success' && emissions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Todavía no hay mediciones. Agrega la primera con el formulario.
        </p>
      )}

      {status === 'success' && emissions.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
