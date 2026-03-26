import type { Intensity, MuscleGroup } from '../types'
import { SKILL_IDS, type SkillLevels } from '../types'

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

export function skillXpMultiplier(
  muscle: MuscleGroup,
  intensity: Intensity,
  streakDays: number,
  skillLevels: SkillLevels,
): number {
  let m = 1
  const globalLevel = skillLevels[SKILL_IDS.globalXp10] ?? 0
  const chestLevel = skillLevels[SKILL_IDS.chestXp10] ?? 0
  const legsLevel = skillLevels[SKILL_IDS.legsXp10] ?? 0
  const highIntensityLevel = skillLevels[SKILL_IDS.highIntensityXp10] ?? 0
  const streakLevel = skillLevels[SKILL_IDS.streakXp5] ?? 0

  m *= 1 + globalLevel * 0.05
  if (muscle === 'Chest') m *= 1 + chestLevel * 0.08
  if (muscle === 'Legs') m *= 1 + legsLevel * 0.08
  if (intensity === 'High') m *= 1 + highIntensityLevel * 0.1
  if (streakDays >= 3) m *= 1 + streakLevel * 0.05
  return m
}

export function computeBaseWorkoutXp(params: {
  sets: number
  reps: number
  weightKg: number
  muscle: MuscleGroup
  intensity: Intensity
  streakDays: number
  skillLevels: SkillLevels
}): number {
  const { sets, reps, weightKg, muscle, intensity, streakDays, skillLevels } = params
  const base = sets * reps * weightKg * 0.1
  const raw =
    base *
    MUSCLE_FACTOR[muscle] *
    INTENSITY_BONUS[intensity] *
    streakMultiplier(streakDays) *
    skillXpMultiplier(muscle, intensity, streakDays, skillLevels)
  return Math.round(raw * 100) / 100
}

export const PR_BONUS_XP = 200
export function computePrBonusXp(isPr: boolean, skillLevels: SkillLevels): number {
  if (!isPr) return 0
  const prLevel = skillLevels[SKILL_IDS.prBonus50] ?? 0
  return PR_BONUS_XP + prLevel * 50
}
