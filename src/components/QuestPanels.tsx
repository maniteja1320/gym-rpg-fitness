import type { QuestDefinition, QuestProgress } from '../types'
import { useFitness } from '../context/FitnessContext.tsx'

export function QuestPanels() {
  const { state } = useFitness()

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      <QuestCard
        title="Daily quests"
        subtitle={`Resets ${state.dailyKey}`}
        defs={state.dailyQuestDefs}
        progress={state.dailyQuestProgress}
        footerStats={`Today: ${state.dailyStats.workouts} workouts · ${Math.floor(state.dailyStats.xp)} XP`}
      />
      <QuestCard
        title="Weekly quests"
        subtitle={`Week ${state.weeklyKey}`}
        defs={state.weeklyQuestDefs}
        progress={state.weeklyQuestProgress}
        footerStats={`This week: ${state.weeklyStats.workouts} workouts · ${Math.floor(state.weeklyStats.xp)} XP`}
      />
      <QuestCard
        title="Dynamic quests"
        subtitle="New goals each day"
        defs={state.dynamicQuestDefs}
        progress={state.dynamicQuestProgress}
        footerStats={`Today: ${state.dailyStats.workouts} workouts · ${Math.floor(state.dailyStats.xp)} XP`}
      />
    </div>
  )
}

function QuestCard({
  title,
  subtitle,
  defs,
  progress,
  footerStats,
}: {
  title: string
  subtitle: string
  defs: QuestDefinition[]
  progress: QuestProgress[]
  footerStats: string
}) {
  const pmap = new Map(progress.map((p) => [p.questId, p]))

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-5">
      <h2 className="font-display text-base font-bold text-white">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <ul className="mt-4 space-y-3">
        {defs.map((def) => {
          const p = pmap.get(def.id)
          const cur = p?.current ?? 0
          const done = p?.completed ?? false
          const pct = Math.min(100, (cur / def.target) * 100)
          return (
            <li
              key={def.id}
              className="rounded-2xl border border-white/5 bg-slate-950/50 p-3 ring-1 ring-white/5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-200">
                  {def.title}
                </p>
                <span className="shrink-0 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  +{def.rewardXp} XP
                </span>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                {def.type.replaceAll('_', ' ')}
                {def.muscleGroup ? ` · ${def.muscleGroup}` : ''}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    done
                      ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                      : 'bg-gradient-to-r from-slate-600 to-slate-500'
                  }`}
                  style={{ width: `${done ? 100 : pct}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] font-mono text-slate-500">
                {Math.min(cur, def.target)} / {def.target}
                {done ? ' · done' : ''}
              </p>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 border-t border-white/5 pt-3 text-[10px] text-slate-600">{footerStats}</p>
    </section>
  )
}
