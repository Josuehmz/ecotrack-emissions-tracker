import EmissionsTracker from './components/EmissionsTracker.tsx'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-emerald-700 font-bold text-white">
            E
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">EcoTrack</h1>
            <p className="text-sm text-slate-600">Dashboard de emisiones en tiempo real</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <EmissionsTracker />
      </main>
    </div>
  )
}
