export type MuscleGroup = 'Chest' | 'Shoulders' | 'Back' | 'Arms' | 'Legs'
export type Intensity = 'Low' | 'Medium' | 'High'

export type QuestType = 'workout_count' | 'xp_target' | 'muscle_target'
export type QuestPeriod = 'daily' | 'weekly' | 'dynamic'

export interface QuestDefinition {
  id: string
  type: QuestType
  target: number
  muscleGroup?: MuscleGroup
  rewardXp: number
  period: QuestPeriod
  /** Display only */
  title: string
}

export interface QuestProgress {
  questId: string
  current: number
  completed: boolean
}

export interface WorkoutEntry {
  id: string
  at: string
  muscleGroup: MuscleGroup
  subType: string
  exercise: string
  sets: number
  reps: number
  weightKg: number
  intensity: Intensity
  baseXp: number
  prBonusXp: number
  totalXp: number
  volume: number
}

export interface PRRecord {
  bestVolume: number
  history: { date: string; volume: number }[]
}

export interface PeriodStats {
  workouts: number
  xp: number
  muscleCounts: Record<MuscleGroup, number>
}

export interface ToastItem {
  id: string
  message: string
  variant: 'xp' | 'quest' | 'pr' | 'info'
  undoDeleteWorkout?: boolean
}

export interface PRPopup {
  exerciseKey: string
  exerciseLabel: string
  volume: number
}

export const SKILL_IDS = {
  globalXp10: 'skill_global_xp_10',
  chestXp10: 'skill_chest_xp_10',
} as const

export type SkillId = (typeof SKILL_IDS)[keyof typeof SKILL_IDS]
