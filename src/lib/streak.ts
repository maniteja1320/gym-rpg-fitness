/** Local calendar date YYYY-MM-DD */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Difference in whole calendar days from a to b (b - a). */
export function calendarDaysBetween(aKey: string, bKey: string): number {
  const a = parseDateKey(aKey).getTime()
  const b = parseDateKey(bKey).getTime()
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

/**
 * After logging a workout on `todayKey`, update streak.
 * Multiple workouts same day do not increase streak.
 */
export function nextStreakAfterWorkout(
  lastWorkoutDate: string | null,
  currentStreak: number,
  todayKey: string,
): number {
  if (!lastWorkoutDate) return 1
  if (lastWorkoutDate === todayKey) return Math.max(1, currentStreak)
  const diff = calendarDaysBetween(lastWorkoutDate, todayKey)
  if (diff === 1) return Math.max(1, currentStreak) + 1
  if (diff <= 0) return Math.max(1, currentStreak)
  return 1
}

export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
