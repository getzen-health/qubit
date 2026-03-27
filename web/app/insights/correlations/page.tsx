'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Lightbulb, TrendingUp } from 'lucide-react'

interface CorrelationData {
  correlations: { mood_vs_steps: number; mood_vs_sleep: number }
  chartData: Array<{ date: string; mood: number | null; steps: number | null; sleep_h: number | null }>
  patterns: string[]
  dataPoints: number
}

function CorrBadge({ value }: { value: number }) {
  const abs = Math.abs(value)
  const label = abs >= 0.6 ? 'Strong' : abs >= 0.3 ? 'Moderate' : 'Weak'
  const dir = value > 0 ? 'positive' : value < 0 ? 'negative' : 'none'
  const color = dir === 'positive' ? 'text-green-400' : dir === 'negative' ? 'text-red-400' : 'text-text-secondary'
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}</p>
      <p className="text-xs text-text-secondary">{label} {dir !== 'none' ? dir : ''} correlation</p>
    </div>
  )
}

export default function CorrelationsPage() {
  const [data, setData] = useState<CorrelationData | null>(null)
  const [tab, setTab] = useState<'sleep' | 'steps'>('sleep')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/insights/correlations')
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message ?? 'Failed to load correlations'); setLoading(false) })
  }, [])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-64 animate-pulse bg-surface rounded-2xl" /></div>

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4">{error}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Mood Correlations</h1>
      <p className="text-text-secondary text-sm mb-6">Based on {data?.dataPoints ?? 0} data points (last 30 days)</p>

      {/* Correlation scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-text-secondary font-medium mb-2 text-center">Mood vs Sleep</p>
          <CorrBadge value={data?.correlations.mood_vs_sleep ?? 0} />
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-text-secondary font-medium mb-2 text-center">Mood vs Steps</p>
          <CorrBadge value={data?.correlations.mood_vs_steps ?? 0} />
        </div>
      </div>

      {/* Pattern insights */}
      {(data?.patterns ?? []).length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text-primary text-sm">Patterns Detected</span>
          </div>
          <ul className="space-y-2">
            {data?.patterns.map((p, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-primary mt-0.5">•</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trend chart */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text-primary text-sm">30-Day Overlay</span>
          </div>
          <div className="flex gap-1">
            {(['sleep', 'steps'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${tab === t ? 'bg-primary text-white' : 'text-text-secondary'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data?.chartData ?? []} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis yAxisId="mood" domain={[1, 5]} tick={{ fontSize: 10 }} width={20} />
            <YAxis yAxisId="metric" orientation="right" tick={{ fontSize: 10 }} width={30} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
            <Legend />
            <Line yAxisId="mood" type="monotone" dataKey="mood" name="Mood" stroke="#7c3aed" dot={false} strokeWidth={2} connectNulls />
            {tab === 'sleep' && <Line yAxisId="metric" type="monotone" dataKey="sleep_h" name="Sleep (h)" stroke="#3b82f6" dot={false} strokeWidth={2} connectNulls />}
            {tab === 'steps' && <Line yAxisId="metric" type="monotone" dataKey="steps" name="Steps (k)" stroke="#22c55e" dot={false} strokeWidth={2} connectNulls />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {(!data || data.dataPoints < 5) && (
        <p className="text-xs text-text-secondary mt-4 text-center">Log mood daily for at least a week to see meaningful patterns.</p>
      )}
    </div>
  )
}
