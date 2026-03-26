import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PRRecord } from '../types'

function useCompactChart() {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const apply = () => setCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return compact
}

export function PRChart({ record, title }: { record: PRRecord | null; title: string }) {
  const compact = useCompactChart()

  if (!record || record.history.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 px-2 text-center text-sm text-slate-500 sm:h-64">
        No PR history for this exercise yet.
      </div>
    )
  }

  const data = record.history.map((h) => ({
    date: h.date,
    volume: Math.round(h.volume * 10) / 10,
  }))

  return (
    <div className="h-56 w-full min-w-0 sm:h-72">
      <p className="mb-2 truncate px-1 text-center text-xs font-medium text-slate-400">{title}</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={
            compact
              ? { top: 4, right: 4, left: 0, bottom: 4 }
              : { top: 8, right: 12, left: 0, bottom: 0 }
          }
        >
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: compact ? 9 : 10 }}
            stroke="#334155"
            angle={compact ? -35 : 0}
            textAnchor={compact ? 'end' : 'middle'}
            height={compact ? 52 : 28}
            interval="preserveStartEnd"
          />
          <YAxis
            width={compact ? 36 : 42}
            tick={{ fill: '#94a3b8', fontSize: compact ? 9 : 10 }}
            stroke="#334155"
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="url(#prLineGrad)"
            strokeWidth={2.5}
            dot={{ fill: '#34d399', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <defs>
            <linearGradient id="prLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
