import { useFitness } from '../context/FitnessContext.tsx'

export function WorkoutHistory() {
  const { state, deleteWorkout } = useFitness()
  const rows = state.workouts.slice(0, 40)

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Workout history</h2>
      <p className="mt-1 text-sm text-slate-400">Latest sessions and XP breakdown.</p>
      <div className="touch-scroll mt-4 max-h-[min(420px,55dvh)] space-y-2 overflow-y-auto pr-1 sm:max-h-[420px]">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-500">
            No workouts yet. Log your first set to start your streak.
          </p>
        ) : (
          rows.map((w) => (
            <article
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/40 px-3 py-3 transition hover:border-emerald-500/20 sm:px-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-100">{w.exercise}</p>
                <p className="break-words text-xs text-slate-500">
                  {w.muscleGroup} · {w.subType} · {w.sets}×{w.reps} @ {w.weightKg}kg · {w.intensity}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  {new Date(w.at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-emerald-300">+{w.totalXp} XP</p>
                {w.prBonusXp > 0 ? (
                  <p className="text-[10px] font-medium text-amber-300/90">includes PR bonus</p>
                ) : null}
                <p className="text-[10px] text-slate-500">vol {Math.round(w.volume)}</p>
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      `Delete "${w.exercise}" workout? This will recalculate progress.`,
                    )
                    if (!ok) return
                    deleteWorkout(w.id)
                  }}
                  className="mt-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
