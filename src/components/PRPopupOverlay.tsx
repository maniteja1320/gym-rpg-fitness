import { useFitness } from '../context/FitnessContext.tsx'

export function PRPopupOverlay() {
  const { state } = useFitness()
  if (!state.prPopup) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:p-6">
      <div className="animate-pr-pop mx-auto max-w-[min(100%,20rem)] rounded-2xl border border-amber-400/40 bg-slate-950/95 px-6 py-6 text-center shadow-2xl shadow-amber-500/20 backdrop-blur-xl sm:rounded-3xl sm:px-10 sm:py-8">
        <p className="font-display text-xl font-bold text-amber-200 sm:text-2xl">NEW PR</p>
        <p className="mt-2 text-4xl leading-none">🎉</p>
        <p className="mt-3 text-base font-semibold leading-snug text-white sm:text-lg">
          {state.prPopup.exerciseLabel}
        </p>
        <p className="mt-1 font-mono text-sm text-amber-300/90">
          Volume {Math.round(state.prPopup.volume)}
        </p>
      </div>
    </div>
  )
}
