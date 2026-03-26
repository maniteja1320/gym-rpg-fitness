import { SKILL_IDS, useFitness } from '../context/FitnessContext.tsx'

const SKILLS: {
  id: (typeof SKILL_IDS)[keyof typeof SKILL_IDS]
  name: string
  desc: string
  maxLevel: number
}[] = [
  {
    id: SKILL_IDS.globalXp10,
    name: 'Metabolic Overdrive',
    desc: '+5% XP per level for all workouts.',
    maxLevel: 5,
  },
  {
    id: SKILL_IDS.chestXp10,
    name: 'Iron Chest',
    desc: '+8% XP per level when training Chest.',
    maxLevel: 3,
  },
  {
    id: SKILL_IDS.legsXp10,
    name: 'Titan Legs',
    desc: '+8% XP per level when training Legs.',
    maxLevel: 3,
  },
  {
    id: SKILL_IDS.highIntensityXp10,
    name: 'Redline Protocol',
    desc: '+10% XP per level on High intensity workouts.',
    maxLevel: 3,
  },
  {
    id: SKILL_IDS.streakXp5,
    name: 'Consistency Engine',
    desc: '+5% XP per level when streak is 3 days or more.',
    maxLevel: 4,
  },
  {
    id: SKILL_IDS.prBonus50,
    name: 'PR Hunter',
    desc: '+50 XP per level to PR bonus.',
    maxLevel: 4,
  },
]

export function SkillTree() {
  const { state, upgradeSkill } = useFitness()

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Skill tree</h2>
      <p className="mt-1 text-sm text-slate-400">
        Earn skill points on level up. Unlock permanent XP buffs.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SKILLS.map((s) => {
          const level = state.skillLevels[s.id] ?? 0
          const isMaxed = level >= s.maxLevel
          const canBuy = !isMaxed && state.skillPoints >= 1
          return (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 ring-1 transition ${
                level > 0
                  ? 'border-emerald-400/40 bg-emerald-500/10 ring-emerald-500/20'
                  : 'border-white/10 bg-slate-950/50 ring-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-100">{s.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
                  <p className="mt-2 text-[11px] font-semibold text-emerald-300/90">
                    Level {level}/{s.maxLevel}
                  </p>
                </div>
                <span className="rounded-lg bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                  1 pt
                </span>
              </div>
              {isMaxed ? (
                <p className="mt-3 text-xs font-semibold text-emerald-400">Max level reached</p>
              ) : (
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => upgradeSkill(s.id)}
                  className="mt-3 min-h-12 w-full touch-manipulation rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold uppercase tracking-wide text-emerald-200 transition enabled:hover:bg-emerald-500/20 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-10"
                >
                  Upgrade
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
