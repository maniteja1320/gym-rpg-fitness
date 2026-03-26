/** XP required to advance from level L to L+1: 100 × L^1.5 */
export function xpRequiredForLevel(level: number): number {
  if (level < 1) return 0
  return Math.round(100 * Math.pow(level, 1.5))
}

/** Total XP needed to reach `level` (level 1 = 0 XP). */
export function cumulativeXpToReachLevel(level: number): number {
  if (level <= 1) return 0
  let sum = 0
  for (let L = 1; L < level; L++) {
    sum += xpRequiredForLevel(L)
  }
  return sum
}

export function getLevelProgress(totalXp: number): {
  level: number
  xpIntoLevel: number
  xpForNext: number
  progress01: number
} {
  let level = 1
  while (true) {
    const need = xpRequiredForLevel(level)
    const start = cumulativeXpToReachLevel(level)
    if (totalXp < start + need) {
      const xpIntoLevel = totalXp - start
      const progress01 = need > 0 ? Math.min(1, xpIntoLevel / need) : 1
      return { level, xpIntoLevel, xpForNext: need, progress01 }
    }
    level++
    if (level > 9999) {
      return { level, xpIntoLevel: 0, xpForNext: xpRequiredForLevel(level), progress01: 0 }
    }
  }
}

export function titleForLevel(level: number): string {
  if (level >= 30) return 'Beast'
  if (level >= 15) return 'Warrior'
  if (level >= 5) return 'Athlete'
  return 'Beginner'
}

/** Apply XP; returns new total and how many levels gained. */
export function applyXpGain(
  totalXp: number,
  delta: number,
): { totalXp: number; levelsGained: number; newLevel: number } {
  const before = getLevelProgress(totalXp).level
  const next = totalXp + Math.max(0, delta)
  const after = getLevelProgress(next).level
  return {
    totalXp: next,
    levelsGained: Math.max(0, after - before),
    newLevel: after,
  }
}
