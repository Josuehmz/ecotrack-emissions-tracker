import EmissionsTracker from './components/EmissionsTracker.tsx'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">EcoTrack · Dashboard de emisiones</h1>
          <p className="mt-1 text-sm text-slate-600">
            Huella de carbono por fuente, en kilogramos de CO₂ equivalente.
          </p>
        </header>

        <EmissionsTracker />
      </main>
    </div>
  )
}
