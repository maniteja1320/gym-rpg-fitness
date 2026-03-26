import { useFitness } from '../context/FitnessContext.tsx'

export function PRSection({
  selectedKey,
  onSelect,
}: {
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  const { state } = useFitness()
  const entries = Object.entries(state.personalRecords).sort((a, b) => b[1].bestVolume - a[1].bestVolume)

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Personal records</h2>
      <p className="mt-1 text-sm text-slate-400">Best volume per exercise (sets × reps × weight).</p>
      <div className="touch-scroll mt-4 max-h-[min(16rem,40dvh)] space-y-2 overflow-y-auto sm:max-h-64">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">Log workouts to build your PR board.</p>
        ) : (
          entries.map(([key, pr]) => {
            const [muscle, ...exParts] = key.split('::')
            const exercise = exParts.join('::')
            const active = selectedKey === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`flex min-h-12 w-full touch-manipulation items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left transition active:opacity-90 sm:min-h-0 sm:px-4 ${
                  active
                    ? 'border-emerald-400/50 bg-emerald-500/10'
                    : 'border-white/5 bg-slate-950/40 hover:border-white/15'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{exercise}</p>
                  <p className="text-xs text-slate-500">{muscle}</p>
                </div>
                <span className="shrink-0 font-mono text-sm text-cyan-300">
                  {Math.round(pr.bestVolume)}
                </span>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
