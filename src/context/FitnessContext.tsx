import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  Intensity,
  MuscleGroup,
  PRPopup,
  PRRecord,
  QuestDefinition,
  QuestProgress,
  ToastItem,
  WorkoutEntry,
} from '../types'
import { SKILL_IDS, type SkillId } from '../types'
import {
  defaultDailyQuests,
  defaultWeeklyQuests,
  emptyMuscleCounts,
  generateDynamicQuests,
  initialProgress,
  progressMap,
  refreshProgressFromStats,
} from '../lib/quests'
import { applyXpGain, getLevelProgress } from '../lib/level'
import {
  computeBaseWorkoutXp,
  PR_BONUS_XP,
  trainingVolume,
} from '../lib/xp'
import {
  isoWeekKey,
  nextStreakAfterWorkout,
  toDateKey,
} from '../lib/streak'

const STORAGE_KEY = 'gym-rpg-fitness-v1'

export interface FitnessState {
  totalXp: number
  skillPoints: number
  unlockedSkills: string[]
  workouts: WorkoutEntry[]
  muscleXp: Record<MuscleGroup, number>
  currentStreak: number
  lastWorkoutDate: string | null
  personalRecords: Record<string, PRRecord>
  dailyKey: string
  weeklyKey: string
  dailyQuestDefs: QuestDefinition[]
  weeklyQuestDefs: QuestDefinition[]
  dynamicQuestDefs: QuestDefinition[]
  dailyQuestProgress: QuestProgress[]
  weeklyQuestProgress: QuestProgress[]
  dynamicQuestProgress: QuestProgress[]
  dailyStats: { workouts: number; xp: number; muscleCounts: Record<MuscleGroup, number> }
  weeklyStats: { workouts: number; xp: number; muscleCounts: Record<MuscleGroup, number> }
  toasts: ToastItem[]
  prPopup: PRPopup | null
}

type Action =
  | {
      type: 'LOG_WORKOUT'
      payload: {
        muscleGroup: MuscleGroup
        subType: string
        exercise: string
        sets: number
        reps: number
        weightKg: number
        intensity: Intensity
      }
    }
  | { type: 'UNLOCK_SKILL'; skillId: SkillId }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'CLEAR_PR_POPUP' }
  | { type: 'HYDRATE'; state: FitnessState }

function emptyStats() {
  return {
    workouts: 0,
    xp: 0,
    muscleCounts: emptyMuscleCounts(),
  }
}

function makeToast(message: string, variant: ToastItem['variant']): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    variant,
  }
}

function prKey(muscle: MuscleGroup, exercise: string): string {
  return `${muscle}::${exercise}`
}

function ensurePeriods(s: FitnessState, now: Date): FitnessState {
  const today = toDateKey(now)
  const week = isoWeekKey(now)
  let next = { ...s }

  if (next.dailyKey !== today) {
    next = {
      ...next,
      dailyKey: today,
      dailyQuestDefs: defaultDailyQuests(),
      dynamicQuestDefs: generateDynamicQuests(today),
      dailyQuestProgress: initialProgress(defaultDailyQuests()),
      dynamicQuestProgress: initialProgress(generateDynamicQuests(today)),
      dailyStats: emptyStats(),
    }
  }

  if (next.weeklyKey !== week) {
    next = {
      ...next,
      weeklyKey: week,
      weeklyQuestDefs: defaultWeeklyQuests(),
      weeklyQuestProgress: initialProgress(defaultWeeklyQuests()),
      weeklyStats: emptyStats(),
    }
  }

  const dynOk =
    next.dynamicQuestDefs.length > 0 &&
    next.dynamicQuestDefs.some((d) => d.id.includes(today))
  if (!dynOk) {
    const dyn = generateDynamicQuests(today)
    next = {
      ...next,
      dynamicQuestDefs: dyn,
      dynamicQuestProgress: initialProgress(dyn),
    }
  }

  return next
}

function settleQuests(state: FitnessState, toasts: ToastItem[]): FitnessState {
  let total = state.totalXp
  let skillPoints = state.skillPoints
  let dailyStats = { ...state.dailyStats, muscleCounts: { ...state.dailyStats.muscleCounts } }
  let weeklyStats = { ...state.weeklyStats, muscleCounts: { ...state.weeklyStats.muscleCounts } }
  let dProg = [...state.dailyQuestProgress]
  let wProg = [...state.weeklyQuestProgress]
  let dynProg = [...state.dynamicQuestProgress]

  const pushToast = (t: ToastItem) => {
    toasts.push(t)
  }

  for (let i = 0; i < 24; i++) {
    const beforeD = dProg.map((p) => ({ ...p }))
    const beforeW = wProg.map((p) => ({ ...p }))
    const beforeY = dynProg.map((p) => ({ ...p }))

    dProg = refreshProgressFromStats(state.dailyQuestDefs, dailyStats, progressMap(dProg))
    wProg = refreshProgressFromStats(state.weeklyQuestDefs, weeklyStats, progressMap(wProg))
    dynProg = refreshProgressFromStats(state.dynamicQuestDefs, dailyStats, progressMap(dynProg))

    let granted = 0

    const handleComplete = (
      defs: QuestDefinition[],
      before: QuestProgress[],
      after: QuestProgress[],
    ) => {
      for (let j = 0; j < defs.length; j++) {
        const was = before[j]?.completed
        const now = after[j]?.completed
        if (!was && now) {
          granted += defs[j].rewardXp
          pushToast(makeToast(`🎯 Quest Complete +${defs[j].rewardXp} XP`, 'quest'))
        }
      }
    }

    handleComplete(state.dailyQuestDefs, beforeD, dProg)
    handleComplete(state.weeklyQuestDefs, beforeW, wProg)
    handleComplete(state.dynamicQuestDefs, beforeY, dynProg)

    if (granted <= 0) break

    const applied = applyXpGain(total, granted)
    total = applied.totalXp
    skillPoints += applied.levelsGained

    dailyStats = { ...dailyStats, xp: dailyStats.xp + granted }
    weeklyStats = { ...weeklyStats, xp: weeklyStats.xp + granted }
  }

  return {
    ...state,
    totalXp: total,
    skillPoints,
    dailyStats,
    weeklyStats,
    dailyQuestProgress: dProg,
    weeklyQuestProgress: wProg,
    dynamicQuestProgress: dynProg,
    toasts,
  }
}

function reducer(state: FitnessState, action: Action): FitnessState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'CLEAR_PR_POPUP':
      return { ...state, prPopup: null }
    case 'UNLOCK_SKILL': {
      const id = action.skillId
      if (state.unlockedSkills.includes(id)) return state
      if (state.skillPoints < 1) return state
      return {
        ...state,
        skillPoints: state.skillPoints - 1,
        unlockedSkills: [...state.unlockedSkills, id],
      }
    }
    case 'LOG_WORKOUT': {
      const now = new Date()
      let next = ensurePeriods(state, now)
      const todayKey = toDateKey(now)
      const p = action.payload

      const streakForXp = nextStreakAfterWorkout(
        next.lastWorkoutDate,
        next.currentStreak,
        todayKey,
      )

      const baseXp = Math.round(
        computeBaseWorkoutXp({
          sets: p.sets,
          reps: p.reps,
          weightKg: p.weightKg,
          muscle: p.muscleGroup,
          intensity: p.intensity,
          streakDays: streakForXp,
          unlockedSkills: next.unlockedSkills,
        }),
      )

      const vol = trainingVolume(p.sets, p.reps, p.weightKg)
      const key = prKey(p.muscleGroup, p.exercise)
      const prev = next.personalRecords[key]
      const prevBest = prev?.bestVolume ?? 0
      const isPr = vol > prevBest
      const prBonus = isPr ? PR_BONUS_XP : 0
      const workoutTotalXp = baseXp + prBonus

      const newStreak = streakForXp

      const personalRecords = { ...next.personalRecords }
      if (isPr) {
        const history = [...(prev?.history ?? [])]
        history.push({ date: todayKey, volume: vol })
        personalRecords[key] = { bestVolume: vol, history }
      }

      const entry: WorkoutEntry = {
        id: crypto.randomUUID(),
        at: now.toISOString(),
        muscleGroup: p.muscleGroup,
        subType: p.subType,
        exercise: p.exercise,
        sets: p.sets,
        reps: p.reps,
        weightKg: p.weightKg,
        intensity: p.intensity,
        baseXp,
        prBonusXp: prBonus,
        totalXp: workoutTotalXp,
        volume: vol,
      }

      const workouts = [entry, ...next.workouts]

      const muscleXp = { ...next.muscleXp }
      muscleXp[p.muscleGroup] = (muscleXp[p.muscleGroup] ?? 0) + workoutTotalXp

      const applied = applyXpGain(next.totalXp, workoutTotalXp)
      let skillPoints = next.skillPoints + applied.levelsGained

      const dailyStats = {
        workouts: next.dailyStats.workouts + 1,
        xp: next.dailyStats.xp + workoutTotalXp,
        muscleCounts: { ...next.dailyStats.muscleCounts },
      }
      dailyStats.muscleCounts[p.muscleGroup] += 1

      const weeklyStats = {
        workouts: next.weeklyStats.workouts + 1,
        xp: next.weeklyStats.xp + workoutTotalXp,
        muscleCounts: { ...next.weeklyStats.muscleCounts },
      }
      weeklyStats.muscleCounts[p.muscleGroup] += 1

      const toasts: ToastItem[] = [...next.toasts]
      const pushToast = (t: ToastItem) => {
        toasts.push(t)
      }

      pushToast(makeToast(`+${workoutTotalXp} XP 🔥`, 'xp'))
      if (isPr) {
        pushToast(makeToast(`🏆 NEW PR +${PR_BONUS_XP} XP`, 'pr'))
      }

      let after: FitnessState = {
        ...next,
        totalXp: applied.totalXp,
        skillPoints,
        workouts,
        muscleXp,
        currentStreak: newStreak,
        lastWorkoutDate: todayKey,
        personalRecords,
        dailyStats,
        weeklyStats,
        toasts,
        prPopup: isPr
          ? {
              exerciseKey: key,
              exerciseLabel: p.exercise,
              volume: vol,
            }
          : next.prPopup,
      }

      after = settleQuests(after, toasts)

      return after
    }
    default:
      return state
  }
}

function loadState(): FitnessState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FitnessState
  } catch {
    return null
  }
}

function saveState(s: FitnessState) {
  const { toasts, prPopup, ...rest } = s
  void toasts
  void prPopup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
}

function createFreshState(now: Date): FitnessState {
  const today = toDateKey(now)
  const week = isoWeekKey(now)
  const daily = defaultDailyQuests()
  const weekly = defaultWeeklyQuests()
  const dynamic = generateDynamicQuests(today)
  return {
    totalXp: 0,
    skillPoints: 0,
    unlockedSkills: [],
    workouts: [],
    muscleXp: emptyMuscleCounts(),
    currentStreak: 0,
    lastWorkoutDate: null,
    personalRecords: {},
    dailyKey: today,
    weeklyKey: week,
    dailyQuestDefs: daily,
    weeklyQuestDefs: weekly,
    dynamicQuestDefs: dynamic,
    dailyQuestProgress: initialProgress(daily),
    weeklyQuestProgress: initialProgress(weekly),
    dynamicQuestProgress: initialProgress(dynamic),
    dailyStats: emptyStats(),
    weeklyStats: emptyStats(),
    toasts: [],
    prPopup: null,
  }
}

type LogPayload = {
  muscleGroup: MuscleGroup
  subType: string
  exercise: string
  sets: number
  reps: number
  weightKg: number
  intensity: Intensity
}

const Ctx = createContext<{
  state: FitnessState
  dispatch: React.Dispatch<Action>
  logWorkout: (p: LogPayload) => void
  unlockSkill: (id: SkillId) => void
} | null>(null)

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const now = new Date()
    const loaded = loadState()
    if (loaded) {
      const merged: FitnessState = {
        ...createFreshState(now),
        ...loaded,
        toasts: [],
        prPopup: null,
      }
      return ensurePeriods(merged, now)
    }
    return createFreshState(now)
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const ids = state.toasts.map((t) => t.id)
    if (ids.length === 0) return
    const timers = ids.map((id) =>
      setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id }), 3800),
    )
    return () => timers.forEach(clearTimeout)
  }, [state.toasts])

  useEffect(() => {
    if (!state.prPopup) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_PR_POPUP' }), 3200)
    return () => clearTimeout(t)
  }, [state.prPopup])

  const logWorkout = useCallback((payload: LogPayload) => {
    dispatch({ type: 'LOG_WORKOUT', payload })
  }, [])

  const unlockSkill = useCallback((skillId: SkillId) => {
    dispatch({ type: 'UNLOCK_SKILL', skillId })
  }, [])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      logWorkout,
      unlockSkill,
    }),
    [state, logWorkout, unlockSkill],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFitness() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useFitness outside provider')
  return c
}

export function useLevelInfo() {
  const { state } = useFitness()
  return getLevelProgress(state.totalXp)
}

export { SKILL_IDS }
