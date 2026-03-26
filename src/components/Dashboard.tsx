import { titleForLevel } from '../lib/level'
import { useFitness, useLevelInfo } from '../context/FitnessContext.tsx'

export function Dashboard() {
  const { state } = useFitness()
  const { level, xpIntoLevel, xpForNext, progress01 } = useLevelInfo()
  const title = titleForLevel(level)

  return (
    <section className="glass-card relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Character
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
              Lv. {level}
            </span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
              {title}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Total XP:{' '}
            <span className="font-mono text-slate-200">{Math.floor(state.totalXp).toLocaleString()}</span>
          </p>
          <div className="mt-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-400">
              <span>Level progress</span>
              <span className="shrink-0 font-mono text-emerald-300/90">
                {Math.floor(xpIntoLevel)} / {xpForNext} XP
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, progress01 * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-4">
          <StatPill label="Streak" value={`${state.currentStreak}d`} accent="from-amber-400 to-orange-500" />
          <StatPill
            label="Skill pts"
            value={String(state.skillPoints)}
            accent="from-violet-400 to-fuchsia-500"
          />
          <StatPill
            label="Workouts"
            value={String(state.workouts.length)}
            accent="from-cyan-400 to-blue-500"
          />
        </div>
      </div>
    </section>
  )
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-center ring-1 ring-white/5 sm:rounded-2xl sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 bg-gradient-to-br bg-clip-text font-display text-xl font-bold text-transparent sm:text-2xl ${accent} `}
      >
        {value}
      </p>
    </div>
  )
}
