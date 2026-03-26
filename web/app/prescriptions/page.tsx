'use client'
import { useEffect, useState } from 'react'

const INTENSITY_COLORS: Record<string, string> = {
  rest: 'bg-gray-100 text-gray-700 border-gray-200',
  easy: 'bg-blue-50 text-blue-700 border-blue-200',
  moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  hard: 'bg-orange-50 text-orange-700 border-orange-200',
  peak: 'bg-red-50 text-red-700 border-red-200',
}

export default function PrescriptionsPage() {
  const [prescription, setPrescription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/prescriptions/daily')
      .then(r => r.json())
      .then(d => { setPrescription(d.prescription); setLoading(false) })
  }, [])

  const markFollowed = async (val: boolean) => {
    setFollowed(val)
    await fetch('/api/prescriptions/daily', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followed: val }),
    })
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-text-secondary">Analyzing your recovery...</div></div>

  const p = prescription
  const colorClass = INTENSITY_COLORS[p?.intensity ?? 'moderate']

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Training Prescription</h1>
        <p className="text-sm text-text-secondary mb-6">Today's recommendation based on your recovery data</p>

        {/* Main prescription card */}
        <div className={`rounded-2xl border-2 p-6 mb-4 ${colorClass}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{p?.intensity_emoji}</span>
            <div>
              <div className="text-2xl font-bold">{p?.intensity_label}</div>
              <div className="text-sm opacity-75">{p?.recommended_workout_type}</div>
            </div>
          </div>
          <div className="text-sm opacity-80 mb-2">⏱ {p?.duration_range} · ❤️ {p?.heart_rate_zone}</div>
        </div>

        {/* Rationale */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Why today?</h3>
          <ul className="space-y-2">
            {p?.rationale_points?.map((point: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-primary">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recovery scores */}
        {p?.scores && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'HRV', value: p.scores.hrv ? `${p.scores.hrv.toFixed(0)} ms` : 'No data', icon: '💓' },
              { label: 'Sleep', value: p.scores.sleep_hours ? `${p.scores.sleep_hours.toFixed(1)}h` : 'No data', icon: '😴' },
              { label: 'Readiness', value: p.scores.readiness ? `${p.scores.readiness.toFixed(0)}/100` : 'No data', icon: '⚡' },
              { label: 'Load Ratio', value: p.scores.acwr ? String(p.scores.acwr) : 'No data', icon: '📊' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-border p-3">
                <div className="text-xs text-text-secondary">{s.icon} {s.label}</div>
                <div className="font-semibold text-text-primary text-sm mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested workouts */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Suggested Workouts</h3>
          <ul className="space-y-2">
            {p?.suggested_workouts?.map((w: string, i: number) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span>→</span><span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recovery tip */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <div className="text-sm text-text-primary">💡 <strong>Pro tip:</strong> {p?.recovery_tip}</div>
        </div>

        {/* Did you follow it? */}
        {followed === null && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <p className="text-sm text-text-secondary mb-3">Did you follow today's prescription?</p>
            <div className="flex gap-3">
              <button onClick={() => markFollowed(true)} className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold">✓ Yes</button>
              <button onClick={() => markFollowed(false)} className="flex-1 py-2 rounded-xl border border-border text-text-secondary text-sm">✗ No</button>
            </div>
          </div>
        )}
        {followed !== null && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 text-sm font-medium">
            {followed ? '✓ Logged! Great work following your prescription.' : 'Noted — data helps us learn your patterns.'}
          </div>
        )}
      </div>
    </div>
  )
}
