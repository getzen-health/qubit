"use client"
import { useState, useEffect } from 'react'

const GOALS = [
  { id: 'lose', label: 'Lose Weight', emoji: '⬇️', deficit: '-500 kcal/day' },
  { id: 'maintain', label: 'Maintain', emoji: '⚖️', deficit: 'TDEE' },
  { id: 'gain', label: 'Build Muscle', emoji: '💪', deficit: '+300 kcal/day' },
  { id: 'recomp', label: 'Recomposition', emoji: '🔄', deficit: 'TDEE + high protein' },
]
const ACTIVITIES = [
  { id: 'sedentary', label: 'Sedentary', detail: 'Desk job, little exercise' },
  { id: 'light', label: 'Lightly Active', detail: '1-3 days/week exercise' },
  { id: 'moderate', label: 'Moderately Active', detail: '3-5 days/week' },
  { id: 'active', label: 'Very Active', detail: '6-7 days/week' },
  { id: 'very_active', label: 'Athlete', detail: '2× daily or physical job' },
]

export default function NutritionTargetsPage() {
  const [targets, setTargets] = useState<any>(null)
  const [suggested, setSuggested] = useState<any>(null)
  const [today, setToday] = useState<any>(null)
  const [goal, setGoal] = useState('maintain')
  const [activity, setActivity] = useState('moderate')
  const [autoCalc, setAutoCalc] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/nutrition/targets').then(r => r.json()),
      fetch('/api/nutrition/daily-summary').then(r => r.json()),
    ]).then(([t, d]) => {
      if (t.targets) { setTargets(t.targets); setGoal(t.targets.goal); setActivity(t.targets.activity_level); setAutoCalc(t.targets.auto_calculated) }
      if (t.suggested) setSuggested(t.suggested)
      setToday(d.totals)
    })
  }, [])

  const displayTargets = targets ?? suggested

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/nutrition/targets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, activity_level: activity, auto_calculate: autoCalc }),
    })
    const d = await res.json()
    if (d.targets) setTargets(d.targets)
    setSaving(false)
  }

  // Macro ring component
  const MacroRing = ({ label, consumed, target, color, unit = 'g' }: any) => {
    const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0
    const r = 32, cx = 40, cy = 40
    const circ = 2 * Math.PI * r
    const offset = circ * (1 - pct / 100)
    return (
      <div className="flex flex-col items-center">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} className="transition-all" />
        </svg>
        <div className="text-center -mt-12 mb-10">
          <div className="font-bold text-text-primary text-sm">{Math.round(consumed)}</div>
          <div className="text-xs text-text-secondary">/{target}{unit}</div>
        </div>
        <div className="text-xs font-medium text-text-secondary">{label}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Nutrition Targets</h1>
        <p className="text-sm text-text-secondary mb-6">Daily macro budget based on your goals</p>

        {/* Today's progress */}
        {displayTargets && today && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-6">
            <h3 className="font-semibold text-text-primary mb-4">Today's Progress</h3>
            <div className="grid grid-cols-4 gap-2">
              <MacroRing label="Calories" consumed={today.calories} target={displayTargets.calories_kcal} color="#6366f1" unit="kcal" />
              <MacroRing label="Protein" consumed={today.protein_g} target={displayTargets.protein_g} color="#10b981" />
              <MacroRing label="Carbs" consumed={today.carbs_g} target={displayTargets.carbs_g} color="#f59e0b" />
              <MacroRing label="Fat" consumed={today.fat_g} target={displayTargets.fat_g} color="#ef4444" />
            </div>
            {displayTargets && (
              <p className="text-xs text-text-secondary text-center mt-2">
                {today.calories} / {displayTargets.calories_kcal} kcal remaining: {(displayTargets.calories_kcal ?? 0) - (today.calories ?? 0)} kcal
              </p>
            )}
          </div>
        )}

        {/* Goal selector */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Your Goal</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className={`rounded-xl border p-3 text-left transition-all ${goal === g.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="font-medium text-text-primary text-sm">{g.emoji} {g.label}</div>
                <div className="text-xs text-text-secondary">{g.deficit}</div>
              </button>
            ))}
          </div>

          <h3 className="font-semibold text-text-primary mb-3">Activity Level</h3>
          <div className="space-y-2 mb-4">
            {ACTIVITIES.map(a => (
              <button key={a.id} onClick={() => setActivity(a.id)}
                className={`w-full rounded-xl border p-3 text-left flex items-center justify-between transition-all ${activity === a.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div>
                  <div className="text-sm font-medium text-text-primary">{a.label}</div>
                  <div className="text-xs text-text-secondary">{a.detail}</div>
                </div>
                {activity === a.id && <span className="text-primary text-sm">✓</span>}
              </button>
            ))}
          </div>

          <button onClick={save} disabled={saving} className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {saving ? 'Saving...' : 'Calculate & Save Targets'}
          </button>

          <p className="text-xs text-text-secondary text-center mt-3">
            Based on Mifflin-St Jeor BMR formula and ISSN protein guidelines (2018)
          </p>
        </div>

        {/* Current targets display */}
        {displayTargets && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Your Daily Targets</h3>
            <div className="space-y-2">
              {[
                { label: '🔥 Calories', value: `${displayTargets.calories_kcal} kcal` },
                { label: '🥩 Protein', value: `${displayTargets.protein_g}g` },
                { label: '🌾 Carbs', value: `${displayTargets.carbs_g}g` },
                { label: '🫒 Fat', value: `${displayTargets.fat_g}g` },
                { label: '🌿 Fiber', value: `${displayTargets.fiber_g}g` },
                { label: '💧 Water', value: `${((displayTargets.water_ml ?? 2000) / 1000).toFixed(1)}L` },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  <span className="font-semibold text-text-primary text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
