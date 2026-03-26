import type { MuscleGroup } from '../types'
import { MUSCLE_GROUPS } from '../data/exercises'
import { useFitness } from '../context/FitnessContext.tsx'

export function MuscleHeatmap() {
  const { state } = useFitness()
  const values = MUSCLE_GROUPS.map((m) => state.muscleXp[m] ?? 0)
  const max = Math.max(1, ...values)

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Muscle XP heatmap</h2>
      <p className="mt-1 text-sm text-slate-400">Intensity scales with XP earned per group.</p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-5">
        {MUSCLE_GROUPS.map((m) => {
          const xp = state.muscleXp[m] ?? 0
          const t = xp / max
          return <MuscleCell key={m} muscle={m} xp={xp} intensity={t} />
        })}
      </div>
    </section>
  )
}

function MuscleCell({
  muscle,
  xp,
  intensity,
}: {
  muscle: MuscleGroup
  xp: number
  intensity: number
}) {
  const glow = 0.15 + intensity * 0.85
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10 p-3 text-center transition hover:border-emerald-400/30 sm:rounded-2xl sm:p-4"
      style={{
        background: `linear-gradient(145deg, rgba(6,78,59,${0.2 + intensity * 0.45}) 0%, rgba(15,23,42,0.9) 100%)`,
        boxShadow: `0 0 ${24 + intensity * 40}px rgba(52,211,153,${glow * 0.25})`,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{muscle}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-emerald-300">{Math.floor(xp)}</p>
      <p className="text-[10px] text-slate-500">XP</p>
    </div>
  )
}
