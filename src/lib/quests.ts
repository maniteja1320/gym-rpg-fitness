import type { MuscleGroup, QuestDefinition, QuestProgress, QuestType, WorkoutEntry } from '../types'

export type BossProgressStats = {
  workouts: number
  xp: number
  muscleCounts: Record<MuscleGroup, number>
  muscleVolume: Record<MuscleGroup, number>
  muscleXp: Record<MuscleGroup, number>
  musclePrSessions: Record<MuscleGroup, number>
  muscleHighIntensity: Record<MuscleGroup, number>
}

export type QuestProgressStats = {
  workouts: number
  xp: number
  muscleCounts: Record<MuscleGroup, number>
  muscleVolume?: Record<MuscleGroup, number>
  muscleXp?: Record<MuscleGroup, number>
  musclePrSessions?: Record<MuscleGroup, number>
  muscleHighIntensity?: Record<MuscleGroup, number>
}

export function emptyMuscleCounts(): Record<MuscleGroup, number> {
  return { Chest: 0, Shoulders: 0, Back: 0, Arms: 0, Legs: 0 }
}

export function buildBossProgressStats(workouts: WorkoutEntry[]): BossProgressStats {
  const muscleCounts = emptyMuscleCounts()
  const muscleVolume = emptyMuscleCounts()
  const muscleXp = emptyMuscleCounts()
  const musclePrSessions = emptyMuscleCounts()
  const muscleHighIntensity = emptyMuscleCounts()
  let xp = 0
  for (const w of workouts) {
    muscleCounts[w.muscleGroup] += 1
    muscleVolume[w.muscleGroup] += w.volume
    muscleXp[w.muscleGroup] += w.totalXp
    if (w.prBonusXp > 0) musclePrSessions[w.muscleGroup] += 1
    if (w.intensity === 'High') muscleHighIntensity[w.muscleGroup] += 1
    xp += w.totalXp
  }
  return {
    workouts: workouts.length,
    xp,
    muscleCounts,
    muscleVolume,
    muscleXp,
    musclePrSessions,
    muscleHighIntensity,
  }
}

const RARITY_XP = {
  Common: 50,
  Rare: 200,
  Epic: 500,
  Legendary: 2000,
} as const

function rarityFromReward(rewardXp: number): QuestDefinition['rarity'] {
  if (rewardXp >= RARITY_XP.Legendary) return 'Legendary'
  if (rewardXp >= RARITY_XP.Epic) return 'Epic'
  if (rewardXp >= RARITY_XP.Rare) return 'Rare'
  return 'Common'
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function roundTo50(n: number): number {
  return Math.round(n / 50) * 50
}

export function generateDailyQuests(params: {
  dailyKey: string
  totalXp: number
  currentStreak: number
  focusMuscleGroup: MuscleGroup | null
}): QuestDefinition[] {
  const { dailyKey, totalXp, currentStreak, focusMuscleGroup } = params
  const levelBand = Math.max(1, Math.floor(Math.sqrt(totalXp / 600)) + 1)
  const focusMuscle =
    focusMuscleGroup ?? MUSCLES[Math.floor(rand01(dailyKey, 'daily-fallback-muscle') * MUSCLES.length)]

  const workoutsTarget = clamp(2 + Math.floor(levelBand / 3) + Math.floor(currentStreak / 10), 2, 6)
  const xpTarget = clamp(roundTo50(700 + levelBand * 220 + currentStreak * 20), 700, 3500)
  const muscleTarget = clamp(2 + Math.floor(levelBand / 4), 2, 5)

  const workoutReward = workoutsTarget >= 5 ? RARITY_XP.Rare : RARITY_XP.Common
  const xpReward = xpTarget >= 2400 ? RARITY_XP.Epic : xpTarget >= 1400 ? RARITY_XP.Rare : RARITY_XP.Common
  const muscleReward = muscleTarget >= 5 ? RARITY_XP.Rare : RARITY_XP.Common

  return [
    {
      id: `daily_workouts_${dailyKey}`,
      type: 'workout_count',
      target: workoutsTarget,
      rewardXp: workoutReward,
      period: 'daily',
      rarity: rarityFromReward(workoutReward),
      title: `Complete ${workoutsTarget} workouts`,
    },
    {
      id: `daily_xp_${dailyKey}`,
      type: 'xp_target',
      target: xpTarget,
      rewardXp: xpReward,
      period: 'daily',
      rarity: rarityFromReward(xpReward),
      title: `Earn ${xpTarget.toLocaleString()} XP`,
    },
    {
      id: `daily_muscle_${focusMuscle.toLowerCase()}_${dailyKey}`,
      type: 'muscle_target',
      target: muscleTarget,
      muscleGroup: focusMuscle,
      rewardXp: muscleReward,
      period: 'daily',
      rarity: rarityFromReward(muscleReward),
      title: `Train ${focusMuscle} ${muscleTarget} times`,
    },
  ]
}

export function defaultDailyQuests(): QuestDefinition[] {
  return generateDailyQuests({
    dailyKey: 'default-seed',
    totalXp: 0,
    currentStreak: 0,
    focusMuscleGroup: null,
  })
}

export function generateWeeklyQuests(params: {
  weeklyKey: string
  totalXp: number
  currentStreak: number
  focusMuscleGroup: MuscleGroup | null
}): QuestDefinition[] {
  const { weeklyKey, totalXp, currentStreak, focusMuscleGroup } = params
  const levelBand = Math.max(1, Math.floor(Math.sqrt(totalXp / 600)) + 1)
  const focusMuscle =
    focusMuscleGroup ??
    MUSCLES[Math.floor(rand01(weeklyKey, 'weekly-fallback-muscle') * MUSCLES.length)]

  const workoutsTarget = clamp(8 + Math.floor(levelBand / 2) + Math.floor(currentStreak / 8), 8, 16)
  const xpTarget = clamp(roundTo50(7000 + levelBand * 900 + currentStreak * 120), 7000, 22000)
  const muscleTarget = clamp(5 + Math.floor(levelBand / 3), 5, 10)

  const workoutReward = workoutsTarget >= 12 ? RARITY_XP.Epic : RARITY_XP.Rare
  const xpReward = xpTarget >= 15000 ? RARITY_XP.Legendary : RARITY_XP.Epic
  const muscleReward = muscleTarget >= 8 ? RARITY_XP.Epic : RARITY_XP.Rare

  return [
    {
      id: `weekly_workouts_${weeklyKey}`,
      type: 'workout_count',
      target: workoutsTarget,
      rewardXp: workoutReward,
      period: 'weekly',
      rarity: rarityFromReward(workoutReward),
      title: `Complete ${workoutsTarget} workouts`,
    },
    {
      id: `weekly_xp_${weeklyKey}`,
      type: 'xp_target',
      target: xpTarget,
      rewardXp: xpReward,
      period: 'weekly',
      rarity: rarityFromReward(xpReward),
      title: `Earn ${xpTarget.toLocaleString()} XP`,
    },
    {
      id: `weekly_muscle_${focusMuscle.toLowerCase()}_${weeklyKey}`,
      type: 'muscle_target',
      target: muscleTarget,
      muscleGroup: focusMuscle,
      rewardXp: muscleReward,
      period: 'weekly',
      rarity: rarityFromReward(muscleReward),
      title: `Train ${focusMuscle} ${muscleTarget} times`,
    },
  ]
}

export function defaultWeeklyQuests(): QuestDefinition[] {
  return generateWeeklyQuests({
    weeklyKey: 'default-week',
    totalXp: 0,
    currentStreak: 0,
    focusMuscleGroup: null,
  })
}

const MUSCLES: MuscleGroup[] = ['Chest', 'Shoulders', 'Back', 'Arms', 'Legs']

/** Deterministic pseudo-random in [0, 1) from string seed. */
function rand01(seed: string, salt: string): number {
  const s = seed + salt
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

function levelBand(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 600)) + 1)
}

function bossScale(totalXp: number, currentStreak: number, muscleWorkouts: number): number {
  return 1 + Math.min(1.15, totalXp / 100000) + Math.min(0.45, currentStreak / 100) + Math.min(0.35, muscleWorkouts / 120)
}

/** Additional kg on top of lifetime muscle volume (random tier of the band). */
function volumeRaidChunkKg(
  seedKey: string,
  salt: string,
  totalXp: number,
  currentStreak: number,
  muscle: MuscleGroup,
  bossStats: BossProgressStats,
): number {
  const lb = levelBand(totalXp)
  const scale = bossScale(totalXp, currentStreak, bossStats.muscleCounts[muscle] ?? 0)
  return Math.floor(
    (5200 + lb * 1800 + Math.floor(rand01(seedKey, `${salt}-vol`) * 1800)) * scale,
  )
}

/** Upper bound of chunk (for clamping old saves that still show huge totals). */
function volumeRaidChunkMaxKg(
  totalXp: number,
  currentStreak: number,
  muscle: MuscleGroup,
  bossStats: BossProgressStats,
): number {
  const lb = levelBand(totalXp)
  const scale = bossScale(totalXp, currentStreak, bossStats.muscleCounts[muscle] ?? 0)
  return Math.floor((5200 + lb * 1800 + 1800) * scale)
}

/** One-time rebalance for Volume Raid rows already stored in localStorage. */
export function clampVolumeRaidBossDefs(
  defs: QuestDefinition[],
  totalXp: number,
  currentStreak: number,
  bossStats: BossProgressStats,
): QuestDefinition[] {
  return defs.map((def) => {
    if (def.type !== 'muscle_volume' || !def.muscleGroup) return def
    const base = bossStats.muscleVolume[def.muscleGroup] ?? 0
    const excess = def.target - base
    if (excess <= 0) return def
    const maxExcess = volumeRaidChunkMaxKg(totalXp, currentStreak, def.muscleGroup, bossStats)
    const newExcess = Math.min(excess, maxExcess)
    const newTarget = Math.floor(base + newExcess)
    if (newTarget === def.target) return def
    return {
      ...def,
      target: newTarget,
      title: `Boss: Volume Raid — ${newTarget.toLocaleString()} kg total volume (${def.muscleGroup})`,
    }
  })
}

/** Stable seed so boss ladder IDs/targets do not churn daily. */
const BOSS_LADDER_SEED = 'boss-ladder-v2'

function bossId(role: string, muscle: MuscleGroup, salt: string): string {
  return `boss_${role}_${muscle.toLowerCase()}_${salt}`
}

function buildOneBossChallenge(params: {
  muscle: MuscleGroup
  kind: QuestType
  seedKey: string
  salt: string
  totalXp: number
  currentStreak: number
  bossStats: BossProgressStats
}): QuestDefinition {
  const { muscle, kind, seedKey, salt, totalXp, currentStreak, bossStats } = params
  const lb = levelBand(totalXp)
  const mCount = bossStats.muscleCounts[muscle] ?? 0
  const scale = bossScale(totalXp, currentStreak, mCount)
  const idSuffix = Math.floor(rand01(seedKey, `${muscle}-${salt}-id`) * 1e12).toString(36)

  const baseVol = bossStats.muscleVolume[muscle] ?? 0
  const baseXp = bossStats.muscleXp[muscle] ?? 0
  const basePr = bossStats.musclePrSessions[muscle] ?? 0
  const baseHi = bossStats.muscleHighIntensity[muscle] ?? 0
  const baseCnt = bossStats.muscleCounts[muscle] ?? 0

  switch (kind) {
    case 'muscle_pr_sessions': {
      const target = Math.min(
        30,
        basePr + 2 + Math.floor(lb / 2) + Math.floor(scale) + Math.floor(rand01(seedKey, `${salt}-pr`) * 2),
      )
      return {
        id: bossId('pr', muscle, idSuffix),
        type: 'muscle_pr_sessions',
        target,
        muscleGroup: muscle,
        rewardXp: RARITY_XP.Epic,
        period: 'dynamic',
        rarity: 'Epic',
        title: `Boss: PR Hunt — ${Math.max(1, target - basePr)} more PRs on ${muscle}`,
      }
    }
    case 'muscle_high_intensity': {
      const target = Math.min(
        35,
        baseHi + 3 + Math.floor(lb / 2) + Math.floor(scale) + Math.floor(rand01(seedKey, `${salt}-hi`) * 3),
      )
      return {
        id: bossId('burn', muscle, idSuffix),
        type: 'muscle_high_intensity',
        target,
        muscleGroup: muscle,
        rewardXp: RARITY_XP.Epic,
        period: 'dynamic',
        rarity: 'Epic',
        title: `Boss: Burn Protocol — ${Math.max(1, target - baseHi)} more High-intensity ${muscle} sessions`,
      }
    }
    case 'muscle_target': {
      const target = Math.min(
        70,
        baseCnt + 5 + Math.floor(lb / 2) + Math.floor(scale * 1.5) + Math.floor(rand01(seedKey, `${salt}-sg`) * 2),
      )
      return {
        id: bossId('siege', muscle, idSuffix),
        type: 'muscle_target',
        target,
        muscleGroup: muscle,
        rewardXp: RARITY_XP.Epic,
        period: 'dynamic',
        rarity: 'Epic',
        title: `Boss: Siege — Complete ${target} total ${muscle} workouts`,
      }
    }
    case 'muscle_volume': {
      const chunk = volumeRaidChunkKg(seedKey, salt, totalXp, currentStreak, muscle, bossStats)
      const target = Math.floor(baseVol + chunk)
      return {
        id: bossId('volume', muscle, idSuffix),
        type: 'muscle_volume',
        target,
        muscleGroup: muscle,
        rewardXp: RARITY_XP.Legendary,
        period: 'dynamic',
        rarity: 'Legendary',
        title: `Boss: Volume Raid — ${target.toLocaleString()} kg total volume (${muscle})`,
      }
    }
    case 'muscle_xp': {
      const target = Math.floor(
        baseXp + (5200 + lb * 1200 + Math.floor(rand01(seedKey, `${salt}-mxp`) * 900)) * scale,
      )
      return {
        id: bossId('xp', muscle, idSuffix),
        type: 'muscle_xp',
        target,
        muscleGroup: muscle,
        rewardXp: RARITY_XP.Legendary,
        period: 'dynamic',
        rarity: 'Legendary',
        title: `Boss: XP Forge — ${target.toLocaleString()} XP earned in ${muscle} training`,
      }
    }
    default:
      return buildOneBossChallenge({
        muscle,
        kind: 'muscle_target',
        seedKey,
        salt: `${salt}-fallback`,
        totalXp,
        currentStreak,
        bossStats,
      })
  }
}

const BOSS_KIND_ORDER: QuestType[] = [
  'muscle_pr_sessions',
  'muscle_high_intensity',
  'muscle_target',
  'muscle_volume',
  'muscle_xp',
]

function buildFiveBossesForMuscle(
  muscle: MuscleGroup,
  totalXp: number,
  currentStreak: number,
  bossStats: BossProgressStats,
): QuestDefinition[] {
  return BOSS_KIND_ORDER.map((kind, i) =>
    buildOneBossChallenge({
      muscle,
      kind,
      seedKey: BOSS_LADDER_SEED,
      salt: `slot-${i}`,
      totalXp,
      currentStreak,
      bossStats,
    }),
  )
}

export function generateBossChallenges(params: {
  seedKey: string
  totalXp: number
  currentStreak: number
  focusMuscleGroup: MuscleGroup | null
  bossStats: BossProgressStats
}): QuestDefinition[] {
  const { totalXp, currentStreak, bossStats } = params
  const out: QuestDefinition[] = []
  for (const m of MUSCLES) {
    out.push(...buildFiveBossesForMuscle(m, totalXp, currentStreak, bossStats))
  }
  return out
}

export function generateReplacementBossChallenge(params: {
  seedKey: string
  muscleGroup: MuscleGroup
  totalXp: number
  currentStreak: number
  forcedKind: QuestType
  bossStats: BossProgressStats
}): QuestDefinition {
  const { seedKey, muscleGroup, totalXp, currentStreak, forcedKind, bossStats } = params
  return buildOneBossChallenge({
    muscle: muscleGroup,
    kind: forcedKind,
    seedKey,
    salt: `rep-${seedKey}`,
    totalXp,
    currentStreak,
    bossStats,
  })
}

export function initialProgress(defs: QuestDefinition[]): QuestProgress[] {
  return defs.map((d) => ({
    questId: d.id,
    current: 0,
    completed: false,
  }))
}

export function progressMap(progress: QuestProgress[]): Map<string, QuestProgress> {
  return new Map(progress.map((p) => [p.questId, p]))
}

export function computeQuestCurrent(def: QuestDefinition, stats: QuestProgressStats): number {
  const m = def.muscleGroup
  switch (def.type) {
    case 'workout_count':
      return stats.workouts
    case 'xp_target':
      return stats.xp
    case 'muscle_target':
      return m ? stats.muscleCounts[m] : 0
    case 'muscle_volume':
      return m && stats.muscleVolume ? stats.muscleVolume[m] : 0
    case 'muscle_xp':
      return m && stats.muscleXp ? stats.muscleXp[m] : 0
    case 'muscle_pr_sessions':
      return m && stats.musclePrSessions ? stats.musclePrSessions[m] : 0
    case 'muscle_high_intensity':
      return m && stats.muscleHighIntensity ? stats.muscleHighIntensity[m] : 0
    default:
      return 0
  }
}

export function refreshProgressFromStats(
  defs: QuestDefinition[],
  stats: QuestProgressStats,
  existing: Map<string, QuestProgress>,
): QuestProgress[] {
  return defs.map((def) => {
    const prev = existing.get(def.id)
    const cur = Math.min(def.target, computeQuestCurrent(def, stats))
    const completed = prev?.completed || cur >= def.target
    return {
      questId: def.id,
      current: completed ? def.target : cur,
      completed,
    }
  })
}
