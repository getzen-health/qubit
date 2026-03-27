'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface MeasurementPoint {
  measured_at: string
  weight_kg: number | null
  bmi: number | null
  body_fat_pct: number | null
  waist_cm: number | null
  hip_cm: number | null
  chest_cm: number | null
}

export function MeasurementsTrendChart() {
  const [data, setData] = useState<MeasurementPoint[]>([])
  const [goalWeight, setGoalWeight] = useState<number | null>(null)
  const [days, setDays] = useState(30)
  const [tab, setTab] = useState<'weight' | 'body' | 'measurements'>('weight')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/measurements/trends?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d.data ?? []); setGoalWeight(d.goalWeight); setLoading(false) })
      .catch(() => setLoading(false))
  }, [days])

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.measured_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }))

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['weight','body','measurements'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-secondary'}`}>
              {t === 'body' ? 'Body Comp' : t === 'measurements' ? 'Circumference' : 'Weight'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-2 py-1 text-xs rounded ${days === d ? 'bg-primary/20 text-primary' : 'text-text-secondary'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>
      
      {loading && <div className="h-48 animate-pulse bg-surface-secondary rounded-xl" />}
      
      {!loading && data.length === 0 && (
        <div className="h-48 flex items-center justify-center text-text-secondary text-sm">No measurement data yet</div>
      )}
      
      {!loading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
            <Legend />
            {tab === 'weight' && <>
              <Line type="monotone" dataKey="weight_kg" name="Weight (kg)" stroke="#7c3aed" dot={false} strokeWidth={2} connectNulls />
              {goalWeight && <ReferenceLine y={goalWeight} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Goal', fill: '#22c55e', fontSize: 11 }} />}
            </>}
            {tab === 'body' && <Line type="monotone" dataKey="body_fat_pct" name="Body Fat %" stroke="#f97316" dot={false} strokeWidth={2} connectNulls />}
            {tab === 'measurements' && <>
              <Line type="monotone" dataKey="waist_cm" name="Waist (cm)" stroke="#3b82f6" dot={false} strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="hip_cm" name="Hip (cm)" stroke="#ec4899" dot={false} strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="chest_cm" name="Chest (cm)" stroke="#f59e0b" dot={false} strokeWidth={2} connectNulls />
            </>}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
