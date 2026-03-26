import type { MuscleGroup, QuestDefinition, QuestProgress } from '../types'

export function emptyMuscleCounts(): Record<MuscleGroup, number> {
  return { Chest: 0, Shoulders: 0, Back: 0, Arms: 0, Legs: 0 }
}

export function defaultDailyQuests(): QuestDefinition[] {
  return [
    {
      id: 'daily_workouts_1',
      type: 'workout_count',
      target: 1,
      rewardXp: 50,
      period: 'daily',
      title: 'Complete 1 workout',
    },
    {
      id: 'daily_xp_500',
      type: 'xp_target',
      target: 500,
      rewardXp: 100,
      period: 'daily',
      title: 'Earn 500 XP',
    },
    {
      id: 'daily_muscle_chest',
      type: 'muscle_target',
      target: 1,
      muscleGroup: 'Chest',
      rewardXp: 75,
      period: 'daily',
      title: 'Train Chest',
    },
  ]
}

export function defaultWeeklyQuests(): QuestDefinition[] {
  return [
    {
      id: 'weekly_workouts_5',
      type: 'workout_count',
      target: 5,
      rewardXp: 300,
      period: 'weekly',
      title: 'Complete 5 workouts',
    },
    {
      id: 'weekly_xp_2500',
      type: 'xp_target',
      target: 2500,
      rewardXp: 400,
      period: 'weekly',
      title: 'Earn 2,500 XP',
    },
    {
      id: 'weekly_legs_3',
      type: 'muscle_target',
      target: 3,
      muscleGroup: 'Legs',
      rewardXp: 350,
      period: 'weekly',
      title: 'Train Legs 3 times',
    },
  ]
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

export function generateDynamicQuests(dailyKey: string): QuestDefinition[] {
  const xpLow = 300 + Math.floor(rand01(dailyKey, 'dxp') * 500)
  const muscle = MUSCLES[Math.floor(rand01(dailyKey, 'dm') * MUSCLES.length)]
  const muscleTarget = 1 + Math.floor(rand01(dailyKey, 'dmt') * 2)
  return [
    {
      id: `dyn_xp_${dailyKey}`,
      type: 'xp_target',
      target: xpLow,
      rewardXp: 120 + Math.floor(rand01(dailyKey, 'dr1') * 120),
      period: 'dynamic',
      title: `Dynamic: Earn ${xpLow} XP`,
    },
    {
      id: `dyn_muscle_${dailyKey}`,
      type: 'muscle_target',
      target: muscleTarget,
      muscleGroup: muscle,
      rewardXp: 100 + Math.floor(rand01(dailyKey, 'dr2') * 100),
      period: 'dynamic',
      title: `Dynamic: Train ${muscle} (${muscleTarget}x)`,
    },
  ]
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

export function computeQuestCurrent(
  def: QuestDefinition,
  stats: { workouts: number; xp: number; muscleCounts: Record<MuscleGroup, number> },
): number {
  switch (def.type) {
    case 'workout_count':
      return stats.workouts
    case 'xp_target':
      return stats.xp
    case 'muscle_target':
      return def.muscleGroup ? stats.muscleCounts[def.muscleGroup] : 0
    default:
      return 0
  }
}

export function refreshProgressFromStats(
  defs: QuestDefinition[],
  stats: { workouts: number; xp: number; muscleCounts: Record<MuscleGroup, number> },
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
