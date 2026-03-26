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
            className="select-field"
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
            className="select-field"
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
            className="select-field"
          >
            {exercisesForSub.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sets">
          <NumberStepper
            value={sets}
            onChange={setSets}
            min={1}
            step={1}
          />
        </Field>
        <Field label="Reps">
          <NumberStepper
            value={reps}
            onChange={setReps}
            min={1}
            step={1}
          />
        </Field>
        <Field label="Weight (kg)">
          <NumberStepper
            value={weight}
            onChange={setWeight}
            min={1}
            step={0.5}
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

function roundToStep(value: number, step: number): number {
  const rounded = Math.round(value / step) * step
  const precision = step < 1 ? 2 : 0
  return Number(rounded.toFixed(precision))
}

function NumberStepper({
  value,
  onChange,
  min,
  step,
}: {
  value: number
  onChange: (n: number) => void
  min: number
  step: number
}) {
  const dec = () => {
    const next = roundToStep(Math.max(min, value - step), step)
    onChange(next)
  }
  const inc = () => {
    onChange(roundToStep(value + step, step))
  }
  const onInput = (raw: string) => {
    const n = Number(raw)
    if (Number.isNaN(n)) return
    onChange(Math.max(min, roundToStep(n, step)))
  }
  const atMin = value <= min + 1e-9

  const btn =
    'flex min-h-11 w-11 shrink-0 touch-manipulation items-center justify-center border-emerald-500/25 bg-gradient-to-b from-slate-900/95 to-slate-950 text-lg font-semibold leading-none text-emerald-400 transition hover:from-emerald-500/25 hover:to-cyan-500/15 hover:text-cyan-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 md:min-h-10 md:w-10 md:text-base'

  return (
    <div className="flex min-h-11 overflow-hidden rounded-xl border border-emerald-500/20 bg-slate-950/75 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.08)] focus-within:border-emerald-400/45 focus-within:ring-2 focus-within:ring-emerald-500/25 md:min-h-10">
      <button type="button" className={`${btn} border-r`} onClick={dec} disabled={atMin} aria-label="Decrease">
        −
      </button>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onInput(e.target.value)}
        className="number-field-inner"
        aria-label="Value"
      />
      <button type="button" className={`${btn} border-l`} onClick={inc} aria-label="Increase">
        +
      </button>
    </div>
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
