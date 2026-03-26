import type { Intensity, MuscleGroup } from '../types'
import { SKILL_IDS, type SkillId } from '../types'

const MUSCLE_FACTOR: Record<MuscleGroup, number> = {
  Legs: 1.6,
  Back: 1.5,
  Chest: 1.4,
  Shoulders: 1.3,
  Arms: 1.2,
}

const INTENSITY_BONUS: Record<Intensity, number> = {
  High: 1.3,
  Medium: 1.15,
  Low: 1,
}

export function streakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.5
  if (streakDays >= 7) return 1.25
  if (streakDays >= 3) return 1.1
  return 1
}

export function trainingVolume(sets: number, reps: number, weightKg: number): number {
  return sets * reps * weightKg
}

export function skillXpMultiplier(muscle: MuscleGroup, unlocked: Set<string>): number {
  let m = 1
  if (unlocked.has(SKILL_IDS.globalXp10)) m *= 1.1
  if (muscle === 'Chest' && unlocked.has(SKILL_IDS.chestXp10)) m *= 1.1
  return m
}

export function computeBaseWorkoutXp(params: {
  sets: number
  reps: number
  weightKg: number
  muscle: MuscleGroup
  intensity: Intensity
  streakDays: number
  unlockedSkills: Iterable<SkillId | string>
}): number {
  const { sets, reps, weightKg, muscle, intensity, streakDays, unlockedSkills } = params
  const base = sets * reps * weightKg * 0.1
  const raw =
    base *
    MUSCLE_FACTOR[muscle] *
    INTENSITY_BONUS[intensity] *
    streakMultiplier(streakDays) *
    skillXpMultiplier(muscle, new Set(unlockedSkills))
  return Math.round(raw * 100) / 100
}

export const PR_BONUS_XP = 200
