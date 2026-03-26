import { useEffect, useMemo, useState } from 'react'
import { Dashboard } from './components/Dashboard.tsx'
import { MuscleHeatmap } from './components/MuscleHeatmap.tsx'
import { PRChart } from './components/PRChart.tsx'
import { PRPopupOverlay } from './components/PRPopupOverlay.tsx'
import { PRSection } from './components/PRSection.tsx'
import { QuestPanels } from './components/QuestPanels.tsx'
import { SkillTree } from './components/SkillTree.tsx'
import { ToastHost } from './components/ToastHost.tsx'
import { WorkoutForm } from './components/WorkoutForm.tsx'
import { WorkoutHistory } from './components/WorkoutHistory.tsx'
import { useFitness } from './context/FitnessContext.tsx'

function AppContent() {
  const { state } = useFitness()
  const keys = useMemo(() => Object.keys(state.personalRecords), [state.personalRecords])
  const [selectedPr, setSelectedPr] = useState<string | null>(null)

  useEffect(() => {
    if (keys.length === 0) {
      setSelectedPr(null)
      return
    }
    if (!selectedPr || !keys.includes(selectedPr)) {
      setSelectedPr(keys[0] ?? null)
    }
  }, [keys, selectedPr])

  const prRecord = selectedPr ? state.personalRecords[selectedPr] ?? null : null
  const prTitle = selectedPr ? selectedPr.split('::').slice(1).join('::') : ''

  return (
    <div className="min-h-[100dvh] min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-5 sm:px-4 sm:py-8 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80 sm:text-xs sm:tracking-[0.25em]">
              Gym RPG
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              Level up your lifts
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Log training, chase quests, break PRs, and stack streak multipliers—Strong meets RPG
              progression.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:space-y-8 sm:px-4 sm:py-8">
        <Dashboard />

        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
          <WorkoutForm />
          <WorkoutHistory />
        </div>

        <QuestPanels />

        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
          <PRSection selectedKey={selectedPr} onSelect={setSelectedPr} />
          <section className="glass-card min-w-0 rounded-3xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl sm:p-6">
            <h2 className="font-display text-lg font-bold text-white">PR progression</h2>
            <p className="mt-1 text-sm text-slate-400">Volume over time (Recharts).</p>
            <div className="mt-4">
              <PRChart record={prRecord} title={prTitle || 'Select an exercise'} />
            </div>
          </section>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
          <SkillTree />
          <MuscleHeatmap />
        </div>
      </main>

      <ToastHost />
      <PRPopupOverlay />
    </div>
  )
}

export default function App() {
  return <AppContent />
}
