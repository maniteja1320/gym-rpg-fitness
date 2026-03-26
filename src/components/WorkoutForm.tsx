import { useState } from 'react'
import type { Intensity, MuscleGroup } from '../types'
import { EXERCISES, MUSCLE_GROUPS, SUB_TYPES } from '../data/exercises'
import { useFitness } from '../context/FitnessContext.tsx'

const INTENSITIES: Intensity[] = ['Low', 'Medium', 'High']

export function WorkoutForm() {
  const { logWorkout } = useFitness()
  const [muscle, setMuscle] = useState<MuscleGroup>('Chest')
  const [subType, setSubType] = useState(SUB_TYPES.Chest[0])
  const [exercise, setExercise] = useState(EXERCISES.Chest[SUB_TYPES.Chest[0]][0])
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(60)
  const [intensity, setIntensity] = useState<Intensity>('Medium')

  const subTypes = SUB_TYPES[muscle]
  const exercisesForSub = EXERCISES[muscle][subType] ?? []

  const onMuscleChange = (m: MuscleGroup) => {
    setMuscle(m)
    const st = SUB_TYPES[m][0]
    setSubType(st)
    setExercise(EXERCISES[m][st][0])
  }

  const onSubChange = (st: string) => {
    setSubType(st)
    const list = EXERCISES[muscle][st]
    setExercise(list[0] ?? '')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sets < 1 || reps < 1 || weight <= 0 || !exercise) return
    logWorkout({
      muscleGroup: muscle,
      subType,
      exercise,
      sets,
      reps,
      weightKg: weight,
      intensity,
    })
  }

  return (
    <section className="glass-card rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
      <h2 className="font-display text-lg font-bold text-white">Log workout</h2>
      <p className="mt-1 text-sm text-slate-400">Earn XP from volume, streaks, and intensity.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2">
        <Field label="Muscle group">
          <select
            value={muscle}
            onChange={(e) => onMuscleChange(e.target.value as MuscleGroup)}
            className="input-field"
          >
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sub-type">
          <select
            value={subType}
            onChange={(e) => onSubChange(e.target.value)}
            className="input-field"
          >
            {subTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Exercise" className="sm:col-span-2">
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="input-field"
          >
            {exercisesForSub.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sets">
          <input
            type="number"
            min={1}
            value={sets}
            onChange={(e) => setSets(Number(e.target.value))}
            className="input-field"
          />
        </Field>
        <Field label="Reps">
          <input
            type="number"
            min={1}
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
            className="input-field"
          />
        </Field>
        <Field label="Weight (kg)">
          <input
            type="number"
            min={1}
            step={0.5}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="input-field"
          />
        </Field>
        <Field label="Intensity" className="sm:col-span-2">
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIntensity(i)}
                className={`min-h-12 touch-manipulation rounded-xl border px-2 py-2.5 text-sm font-medium transition active:scale-[0.98] sm:min-h-11 sm:px-3 ${
                  intensity === i
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                    : 'border-white/10 bg-slate-950/40 text-slate-400 hover:border-white/20'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </Field>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="min-h-12 w-full touch-manipulation rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            Log &amp; earn XP
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}
