import { useMemo } from 'react'
import type { QuestDefinition, QuestProgress } from '../types'
import { useFitness } from '../context/FitnessContext.tsx'

function questTypeLabel(type: QuestDefinition['type']): string {
  switch (type) {
    case 'muscle_volume':
      return 'Volume raid'
    case 'muscle_xp':
      return 'XP forge'
    case 'muscle_pr_sessions':
      return 'PR hunt'
    case 'muscle_high_intensity':
      return 'Burn protocol'
    case 'workout_count':
      return 'Workouts'
    case 'xp_target':
      return 'XP target'
    case 'muscle_target':
      return 'Siege'
  }
}

const rarityStyles: Record<QuestDefinition['rarity'], string> = {
  Common: 'bg-white/10 text-white border-white/30',
  Rare: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
  Epic: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  Legendary: 'bg-amber-500/20 text-yellow-300 border-amber-300/50',
}

export function QuestPanels() {
  const { state } = useFitness()

  const { bossDefs, bossProgress } = useMemo(() => {
    const focus = state.focusMuscleGroup
    if (!focus) {
      return { bossDefs: [] as QuestDefinition[], bossProgress: [] as QuestProgress[] }
    }
    const defs = state.dynamicQuestDefs.filter((d) => d.muscleGroup === focus)
    const idSet = new Set(defs.map((d) => d.id))
    const progress = state.dynamicQuestProgress.filter((p) => idSet.has(p.questId))
    return { bossDefs: defs, bossProgress: progress }
  }, [state.dynamicQuestDefs, state.dynamicQuestProgress, state.focusMuscleGroup])

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      <QuestCard
        title="Daily Challenges"
        subtitle={`Resets ${state.dailyKey} · Focus ${state.focusMuscleGroup ?? 'Auto'}`}
        defs={state.dailyQuestDefs}
        progress={state.dailyQuestProgress}
        footerStats={`Today: ${state.dailyStats.workouts} workouts · ${Math.floor(state.dailyStats.xp)} XP`}
      />
      <QuestCard
        title="Weekly Challenges"
        subtitle={`Week ${state.weeklyKey} · Focus ${state.focusMuscleGroup ?? 'Auto'}`}
        defs={state.weeklyQuestDefs}
        progress={state.weeklyQuestProgress}
        footerStats={`This week: ${state.weeklyStats.workouts} workouts · ${Math.floor(state.weeklyStats.xp)} XP`}
      />
      <QuestCard
        title="Boss Challenges"
        subtitle={
          state.focusMuscleGroup
            ? `${state.focusMuscleGroup} · 5 boss challenges`
            : 'Select a muscle in the heatmap'
        }
        defs={bossDefs}
        progress={bossProgress}
        footerStats={
          state.focusMuscleGroup ? undefined : 'Bosses are hidden until you pick a muscle'
        }
        scrollable
        scrollMaxClass="max-h-[min(30rem,72vh)]"
        emptyMessage={
          !state.focusMuscleGroup
            ? 'Choose a muscle in the Muscle XP heatmap above to see PR Hunt, Burn Protocol, Siege, Volume Raid, and XP Forge for that group only.'
            : undefined
        }
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
  scrollable,
  scrollMaxClass,
  emptyMessage,
}: {
  title: string
  subtitle: string
  defs: QuestDefinition[]
  progress: QuestProgress[]
  footerStats?: string
  scrollable?: boolean
  /** Tailwind max-height for scroll area (tuned so ~3 boss rows fit before scroll). */
  scrollMaxClass?: string
  emptyMessage?: string
}) {
  const pmap = new Map(progress.map((p) => [p.questId, p]))

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-5">
      <h2 className="font-display text-base font-bold text-white">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
      {defs.length === 0 && emptyMessage ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <ul
          className={`mt-4 space-y-3 ${
            scrollable
              ? `${scrollMaxClass ?? 'max-h-[min(30rem,72vh)]'} overflow-y-auto overflow-x-hidden pr-1 scroll-smooth`
              : ''
          }`}
        >
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
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${rarityStyles[def.rarity]}`}
                    >
                      {def.rarity}
                    </span>
                    <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      +{def.rewardXp} XP
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                  {questTypeLabel(def.type)}
                  {def.muscleGroup ? ` · ${def.muscleGroup}` : ''}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">
                  {def.period} challenge
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
      )}
      {footerStats ? (
        <p className="mt-3 border-t border-white/5 pt-3 text-[10px] text-slate-600">{footerStats}</p>
      ) : null}
    </section>
  )
}
