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

const SET_XP: Record<Intensity, number> = {
  Low: 10,
  Medium: 30,
  High: 50,
}

const WORKOUT_FINISH_XP: Record<Intensity, number> = {
  Low: 50,
  Medium: 125,
  High: 200,
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
  const { sets, muscle, intensity, streakDays, skillLevels } = params
  const base = sets * SET_XP[intensity] + WORKOUT_FINISH_XP[intensity]
  const raw =
    base *
    MUSCLE_FACTOR[muscle] *
    INTENSITY_BONUS[intensity] *
    streakMultiplier(streakDays) *
    skillXpMultiplier(muscle, intensity, streakDays, skillLevels)
  return Math.round(raw * 100) / 100
}

export const PR_BONUS_XP = 200
export function computePrBonusXp(
  isPr: boolean,
  baseWorkoutXp: number,
  skillLevels: SkillLevels,
): number {
  if (!isPr) return 0
  // PR gives a 2x workout bonus (add one extra base workout XP),
  // plus any PR Hunter upgrade bonus.
  const prLevel = skillLevels[SKILL_IDS.prBonus50] ?? 0
  return baseWorkoutXp + prLevel * 50
}

export function streakMilestoneBonus(streakDays: number): number {
  if (streakDays === 100) return 3000
  if (streakDays === 30) return 750
  if (streakDays === 7) return 150
  if (streakDays === 3) return 50
  return 0
}

export function muscleRankFromXp(xp: number): string {
  if (xp >= 50000) return 'Legend'
  if (xp >= 30000) return 'Master'
  if (xp >= 18000) return 'Diamond'
  if (xp >= 10000) return 'Platinum'
  if (xp >= 5000) return 'Gold'
  if (xp >= 2000) return 'Silver'
  return 'Bronze'
}
