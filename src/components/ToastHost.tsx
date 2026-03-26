import { useFitness } from '../context/FitnessContext.tsx'

const variantStyles = {
  xp: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  quest: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
  pr: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  info: 'border-white/10 bg-slate-900/90 text-slate-200',
}

export function ToastHost() {
  const { state, dispatch } = useFitness()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm sm:p-0 sm:pb-6">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto min-h-12 touch-manipulation animate-toast-in rounded-2xl border px-4 py-3 text-left text-base font-medium shadow-2xl backdrop-blur-md transition active:opacity-90 sm:min-h-0 sm:text-sm ${variantStyles[t.variant]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'DISMISS_TOAST', id: t.id })}
              className="text-left"
            >
              {t.message}
            </button>
            {t.undoDeleteWorkout ? (
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'UNDO_DELETE_WORKOUT' })
                  dispatch({ type: 'DISMISS_TOAST', id: t.id })
                }}
                className="rounded-lg border border-white/30 px-2 py-1 text-xs font-semibold text-white/90 transition hover:bg-white/10"
              >
                Undo
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
