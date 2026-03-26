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
  QuestRarity,
  SkillLevels,
  ToastItem,
  WorkoutEntry,
} from '../types'
import { SKILL_IDS, type SkillId } from '../types'
import {
  buildBossProgressStats,
  clampVolumeRaidBossDefs,
  computeQuestCurrent,
  emptyMuscleCounts,
  generateBossChallenges,
  generateDailyQuests,
  generateReplacementBossChallenge,
  generateWeeklyQuests,
  initialProgress,
  progressMap,
  refreshProgressFromStats,
  type BossProgressStats,
} from '../lib/quests'
import { applyXpGain, getLevelProgress } from '../lib/level'
import {
  computeBaseWorkoutXp,
  computePrBonusXp,
  streakMilestoneBonus,
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
  skillLevels: SkillLevels
  focusMuscleGroup: MuscleGroup | null
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
  pendingUndoWorkout: WorkoutEntry | null
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
  | { type: 'UPGRADE_SKILL'; skillId: SkillId }
  | { type: 'SET_FOCUS_MUSCLE'; muscleGroup: MuscleGroup | null }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'UNDO_DELETE_WORKOUT' }
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

function totalSpentSkillPoints(skillLevels: SkillLevels): number {
  return Object.values(skillLevels).reduce((sum, level) => sum + (level ?? 0), 0)
}

function inferRarityFromReward(rewardXp: number): QuestRarity {
  if (rewardXp >= 2000) return 'Legendary'
  if (rewardXp >= 500) return 'Epic'
  if (rewardXp >= 200) return 'Rare'
  return 'Common'
}

function normalizeQuestDefs(defs: QuestDefinition[] | undefined): QuestDefinition[] {
  if (!defs) return []
  return defs.map((def) => ({
    ...def,
    rarity: def.rarity ?? inferRarityFromReward(def.rewardXp),
  }))
}

function buildDailyQuestsForState(
  dailyKey: string,
  s: Pick<FitnessState, 'totalXp' | 'currentStreak' | 'focusMuscleGroup'>,
): QuestDefinition[] {
  return generateDailyQuests({
    dailyKey,
    totalXp: s.totalXp,
    currentStreak: s.currentStreak,
    focusMuscleGroup: s.focusMuscleGroup,
  })
}

function buildWeeklyQuestsForState(
  weeklyKey: string,
  s: Pick<FitnessState, 'totalXp' | 'currentStreak' | 'focusMuscleGroup'>,
): QuestDefinition[] {
  return generateWeeklyQuests({
    weeklyKey,
    totalXp: s.totalXp,
    currentStreak: s.currentStreak,
    focusMuscleGroup: s.focusMuscleGroup,
  })
}

function buildBossChallengesForState(
  seedKey: string,
  s: Pick<FitnessState, 'totalXp' | 'currentStreak' | 'focusMuscleGroup'>,
  bossStats: BossProgressStats,
): QuestDefinition[] {
  return generateBossChallenges({
    seedKey,
    totalXp: s.totalXp,
    currentStreak: s.currentStreak,
    focusMuscleGroup: s.focusMuscleGroup,
    bossStats,
  })
}

function ensurePeriods(s: FitnessState, now: Date): FitnessState {
  const today = toDateKey(now)
  const week = isoWeekKey(now)
  let next = { ...s }

  if (next.dailyKey !== today) {
    const dailyDefs = buildDailyQuestsForState(today, next)
    next = {
      ...next,
      dailyKey: today,
      dailyQuestDefs: dailyDefs,
      dailyQuestProgress: initialProgress(dailyDefs),
      dailyStats: emptyStats(),
    }
  }

  if (next.weeklyKey !== week) {
    const weeklyDefs = buildWeeklyQuestsForState(week, next)
    next = {
      ...next,
      weeklyKey: week,
      weeklyQuestDefs: weeklyDefs,
      weeklyQuestProgress: initialProgress(weeklyDefs),
      weeklyStats: emptyStats(),
    }
  }

  const dynOk = next.dynamicQuestDefs.length >= 25
  if (!dynOk) {
    const dyn = buildBossChallengesForState(today, next, buildBossProgressStats(next.workouts))
    next = {
      ...next,
      dynamicQuestDefs: dyn,
      dynamicQuestProgress: initialProgress(dyn),
    }
  }

  return next
}

const BOSS_LADDER_SLOTS = 25

function replaceCompletedBossQuests(
  after: FitnessState,
  dynBefore: QuestProgress[],
): FitnessState {
  const bossStats = buildBossProgressStats(after.workouts)
  const defs = [...after.dynamicQuestDefs]
  const prog = [...after.dynamicQuestProgress]
  let changed = false
  for (let i = 0; i < defs.length; i++) {
    const was = dynBefore[i]?.completed ?? false
    const now = prog[i]?.completed ?? false
    if (was || !now) continue
    const oldDef = defs[i]
    if (!oldDef?.muscleGroup || oldDef.period !== 'dynamic') continue
    const replacement = generateReplacementBossChallenge({
      seedKey: `${after.dailyKey}-${after.totalXp}-slot${i}-${oldDef.type}`,
      muscleGroup: oldDef.muscleGroup,
      totalXp: after.totalXp,
      currentStreak: after.currentStreak,
      forcedKind: oldDef.type,
      bossStats,
    })
    defs[i] = replacement
    prog[i] = {
      questId: replacement.id,
      current: Math.min(replacement.target, computeQuestCurrent(replacement, bossStats)),
      completed: false,
    }
    changed = true
  }
  if (!changed) return after
  return { ...after, dynamicQuestDefs: defs, dynamicQuestProgress: prog }
}

function settleQuests(state: FitnessState, toasts: ToastItem[]): FitnessState {
  let total = state.totalXp
  let skillPoints = state.skillPoints
  let dailyStats = { ...state.dailyStats, muscleCounts: { ...state.dailyStats.muscleCounts } }
  let weeklyStats = { ...state.weeklyStats, muscleCounts: { ...state.weeklyStats.muscleCounts } }
  const bossStats = buildBossProgressStats(state.workouts)
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
    dynProg = refreshProgressFromStats(state.dynamicQuestDefs, bossStats, progressMap(dynProg))

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

function rebuildStateFromWorkouts(previous: FitnessState, remaining: WorkoutEntry[]): FitnessState {
  const now = new Date()
  let next = createFreshState(now)
  next = {
    ...next,
    skillLevels: { ...previous.skillLevels },
    // Re-apply spent points for current skill levels (1 point per level).
    skillPoints: -totalSpentSkillPoints(previous.skillLevels),
  }

  const sorted = [...remaining].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )

  for (const entry of sorted) {
    const at = new Date(entry.at)
    next = ensurePeriods(next, at)
    const dayKey = toDateKey(at)

    const streakForXp = nextStreakAfterWorkout(next.lastWorkoutDate, next.currentStreak, dayKey)
    const key = prKey(entry.muscleGroup, entry.exercise)
    const prev = next.personalRecords[key]
    const prevBest = prev?.bestVolume ?? 0
    const isPr = entry.volume > prevBest

    const personalRecords = { ...next.personalRecords }
    if (isPr) {
      const history = [...(prev?.history ?? [])]
      history.push({ date: dayKey, volume: entry.volume })
      personalRecords[key] = { bestVolume: entry.volume, history }
    }

    const muscleXp = { ...next.muscleXp }
    muscleXp[entry.muscleGroup] = (muscleXp[entry.muscleGroup] ?? 0) + entry.totalXp

    const applied = applyXpGain(next.totalXp, entry.totalXp)
    const dailyStats = {
      workouts: next.dailyStats.workouts + 1,
      xp: next.dailyStats.xp + entry.totalXp,
      muscleCounts: { ...next.dailyStats.muscleCounts },
    }
    dailyStats.muscleCounts[entry.muscleGroup] += 1

    const weeklyStats = {
      workouts: next.weeklyStats.workouts + 1,
      xp: next.weeklyStats.xp + entry.totalXp,
      muscleCounts: { ...next.weeklyStats.muscleCounts },
    }
    weeklyStats.muscleCounts[entry.muscleGroup] += 1

    next = {
      ...next,
      totalXp: applied.totalXp,
      skillPoints: next.skillPoints + applied.levelsGained,
      workouts: [entry, ...next.workouts],
      muscleXp,
      currentStreak: streakForXp,
      lastWorkoutDate: dayKey,
      personalRecords,
      dailyStats,
      weeklyStats,
      toasts: [],
      prPopup: null,
    }

    next = settleQuests(next, [])
  }

  return {
    ...next,
    // Avoid surfacing negative available points if XP falls below spent allocations.
    skillPoints: Math.max(0, next.skillPoints),
    toasts: [],
    prPopup: null,
  }
}

function reducer(state: FitnessState, action: Action): FitnessState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
    case 'DISMISS_TOAST': {
      const dismissed = state.toasts.find((t) => t.id === action.id)
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
        pendingUndoWorkout: dismissed?.undoDeleteWorkout ? null : state.pendingUndoWorkout,
      }
    }
    case 'CLEAR_PR_POPUP':
      return { ...state, prPopup: null }
    case 'UPGRADE_SKILL': {
      const id = action.skillId
      if (state.skillPoints < 1) return state
      const currentLevel = state.skillLevels[id] ?? 0
      const MAX_LEVELS: Partial<Record<SkillId, number>> = {
        [SKILL_IDS.globalXp10]: 5,
        [SKILL_IDS.chestXp10]: 3,
        [SKILL_IDS.legsXp10]: 3,
        [SKILL_IDS.highIntensityXp10]: 3,
        [SKILL_IDS.streakXp5]: 4,
        [SKILL_IDS.prBonus50]: 4,
      }
      const max = MAX_LEVELS[id] ?? 1
      if (currentLevel >= max) return state
      return {
        ...state,
        skillPoints: state.skillPoints - 1,
        skillLevels: {
          ...state.skillLevels,
          [id]: currentLevel + 1,
        },
      }
    }
    case 'SET_FOCUS_MUSCLE': {
      const dailyDefs = buildDailyQuestsForState(state.dailyKey, {
        totalXp: state.totalXp,
        currentStreak: state.currentStreak,
        focusMuscleGroup: action.muscleGroup,
      })
      const weeklyDefs = buildWeeklyQuestsForState(state.weeklyKey, {
        totalXp: state.totalXp,
        currentStreak: state.currentStreak,
        focusMuscleGroup: action.muscleGroup,
      })
      const bossStats = buildBossProgressStats(state.workouts)
      let bossDefs: QuestDefinition[]
      let bossProgress: QuestProgress[]
      if (state.dynamicQuestDefs.length >= BOSS_LADDER_SLOTS) {
        bossDefs = state.dynamicQuestDefs
        bossProgress = refreshProgressFromStats(
          bossDefs,
          bossStats,
          progressMap(state.dynamicQuestProgress),
        )
      } else {
        bossDefs = buildBossChallengesForState(
          state.dailyKey,
          {
            totalXp: state.totalXp,
            currentStreak: state.currentStreak,
            focusMuscleGroup: action.muscleGroup,
          },
          bossStats,
        )
        bossProgress = refreshProgressFromStats(
          bossDefs,
          bossStats,
          progressMap(initialProgress(bossDefs)),
        )
      }
      const dailyProgress = refreshProgressFromStats(
        dailyDefs,
        state.dailyStats,
        progressMap(initialProgress(dailyDefs)),
      )
      const weeklyProgress = refreshProgressFromStats(
        weeklyDefs,
        state.weeklyStats,
        progressMap(initialProgress(weeklyDefs)),
      )
      return {
        ...state,
        focusMuscleGroup: action.muscleGroup,
        dailyQuestDefs: dailyDefs,
        dailyQuestProgress: dailyProgress,
        weeklyQuestDefs: weeklyDefs,
        weeklyQuestProgress: weeklyProgress,
        dynamicQuestDefs: bossDefs,
        dynamicQuestProgress: bossProgress,
      }
    }
    case 'DELETE_WORKOUT': {
      const deleted = state.workouts.find((w) => w.id === action.id)
      const remaining = state.workouts.filter((w) => w.id !== action.id)
      if (remaining.length === state.workouts.length) return state
      const rebuilt = rebuildStateFromWorkouts(state, remaining)
      if (!deleted) return rebuilt
      return {
        ...rebuilt,
        pendingUndoWorkout: deleted,
        toasts: [
          ...rebuilt.toasts,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            message: 'Workout deleted',
            variant: 'info',
            undoDeleteWorkout: true,
          },
        ],
      }
    }
    case 'UNDO_DELETE_WORKOUT': {
      if (!state.pendingUndoWorkout) return state
      const restored = rebuildStateFromWorkouts(state, [state.pendingUndoWorkout, ...state.workouts])
      return {
        ...restored,
        pendingUndoWorkout: null,
        toasts: [...restored.toasts, makeToast('Workout restored', 'info')],
      }
    }
    case 'LOG_WORKOUT': {
      const now = new Date()
      let next = ensurePeriods(state, now)
      const dynBefore = [...next.dynamicQuestProgress]
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
          skillLevels: next.skillLevels,
        }),
      )
      const streakBonus = streakMilestoneBonus(streakForXp)

      const vol = trainingVolume(p.sets, p.reps, p.weightKg)
      const key = prKey(p.muscleGroup, p.exercise)
      const prev = next.personalRecords[key]
      const prevBest = prev?.bestVolume ?? 0
      const isPr = vol > prevBest
      const prBonus = computePrBonusXp(isPr, baseXp, next.skillLevels)
      const workoutTotalXp = baseXp + prBonus + streakBonus

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
        streakBonusXp: streakBonus,
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
        pushToast(makeToast(`🏆 NEW PR 2x bonus +${prBonus} XP`, 'pr'))
      }
      if (streakBonus > 0) {
        pushToast(makeToast(`🔥 Streak milestone +${streakBonus} XP`, 'xp'))
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
      after = replaceCompletedBossQuests(after, dynBefore)

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
  const { toasts, prPopup, pendingUndoWorkout, ...rest } = s
  void toasts
  void prPopup
  void pendingUndoWorkout
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
}

function createFreshState(now: Date): FitnessState {
  const today = toDateKey(now)
  const week = isoWeekKey(now)
  const daily = generateDailyQuests({
    dailyKey: today,
    totalXp: 0,
    currentStreak: 0,
    focusMuscleGroup: null,
  })
  const weekly = generateWeeklyQuests({
    weeklyKey: week,
    totalXp: 0,
    currentStreak: 0,
    focusMuscleGroup: null,
  })
  const dynamic = generateBossChallenges({
    seedKey: today,
    totalXp: 0,
    currentStreak: 0,
    focusMuscleGroup: null,
    bossStats: buildBossProgressStats([]),
  })
  return {
    totalXp: 0,
    skillPoints: 0,
    skillLevels: {},
    focusMuscleGroup: null,
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
    pendingUndoWorkout: null,
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
  upgradeSkill: (id: SkillId) => void
  setFocusMuscle: (muscleGroup: MuscleGroup | null) => void
  deleteWorkout: (id: string) => void
  resetAllProgress: () => void
} | null>(null)

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const now = new Date()
    const loaded = loadState()
    if (loaded) {
      const legacyUnlocked =
        (loaded as unknown as { unlockedSkills?: string[] }).unlockedSkills ?? []
      const migratedLevels: SkillLevels = { ...(loaded.skillLevels ?? {}) }
      for (const id of legacyUnlocked) {
        if (!migratedLevels[id as SkillId]) migratedLevels[id as SkillId] = 1
      }
      const bossStatsHydrate = buildBossProgressStats(loaded.workouts ?? [])
      const dynamicDefs = clampVolumeRaidBossDefs(
        normalizeQuestDefs(loaded.dynamicQuestDefs),
        loaded.totalXp ?? 0,
        loaded.currentStreak ?? 0,
        bossStatsHydrate,
      )
      const dynamicProg = refreshProgressFromStats(
        dynamicDefs,
        bossStatsHydrate,
        progressMap(loaded.dynamicQuestProgress ?? []),
      )
      const merged: FitnessState = {
        ...createFreshState(now),
        ...loaded,
        skillLevels: migratedLevels,
        dailyQuestDefs: normalizeQuestDefs(loaded.dailyQuestDefs),
        weeklyQuestDefs: normalizeQuestDefs(loaded.weeklyQuestDefs),
        dynamicQuestDefs: dynamicDefs,
        dynamicQuestProgress: dynamicProg,
        toasts: [],
        prPopup: null,
        pendingUndoWorkout: null,
      }
      return ensurePeriods(merged, now)
    }
    return createFreshState(now)
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (state.toasts.length === 0) return
    const timers = state.toasts.map((toast) => {
      const ms = toast.undoDeleteWorkout ? 8000 : 3800
      return setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: toast.id }), ms)
    })
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

  const upgradeSkill = useCallback((skillId: SkillId) => {
    dispatch({ type: 'UPGRADE_SKILL', skillId })
  }, [])

  const setFocusMuscle = useCallback((muscleGroup: MuscleGroup | null) => {
    dispatch({ type: 'SET_FOCUS_MUSCLE', muscleGroup })
  }, [])

  const deleteWorkout = useCallback((id: string) => {
    dispatch({ type: 'DELETE_WORKOUT', id })
  }, [])

  const resetAllProgress = useCallback(() => {
    dispatch({ type: 'HYDRATE', state: createFreshState(new Date()) })
  }, [])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      logWorkout,
      upgradeSkill,
      setFocusMuscle,
      deleteWorkout,
      resetAllProgress,
    }),
    [state, logWorkout, upgradeSkill, setFocusMuscle, deleteWorkout, resetAllProgress],
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
