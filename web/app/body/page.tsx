'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type BodyEntry = {
  id: string
  recorded_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  lean_body_mass_kg: number | null
  bmi: number | null
  bmr_kcal: number | null
  hydration_pct: number | null
  visceral_fat_level: number | null
  muscle_mass_kg: number | null
}

export default function BodyPage() {
  const [entries, setEntries] = useState<BodyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ weight_kg: '', body_fat_pct: '', muscle_mass_kg: '', hydration_pct: '', visceral_fat_level: '', notes: '', source: 'manual' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/body-composition').then(r => r.json()).then(d => setEntries(d.entries ?? []))
  }, [])

  const latest = entries[0]
  const prev = entries[1]

  const trendArrow = (curr: number | null, prev: number | null, lowerIsBetter = false) => {
    if (!curr || !prev) return ''
    const diff = curr - prev
    if (Math.abs(diff) < 0.1) return '→'
    const up = diff > 0
    return (up !== lowerIsBetter) ? '↑' : '↓'
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      muscle_mass_kg: form.muscle_mass_kg ? parseFloat(form.muscle_mass_kg) : null,
      hydration_pct: form.hydration_pct ? parseFloat(form.hydration_pct) : null,
      visceral_fat_level: form.visceral_fat_level ? parseInt(form.visceral_fat_level) : null,
      notes: form.notes,
      source: form.source,
    }
    const res = await fetch('/api/body-composition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    if (d.entry) {
      setEntries(prev => [d.entry, ...prev])
      setShowForm(false)
      setForm({ weight_kg: '', body_fat_pct: '', muscle_mass_kg: '', hydration_pct: '', visceral_fat_level: '', notes: '', source: 'manual' })
    }
    setSaving(false)
  }

  const bmiCategory = (bmi: number | null) => {
    if (!bmi) return null
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
    if (bmi < 25) return { label: 'Normal', color: 'text-green-500' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' }
    return { label: 'Obese', color: 'text-red-500' }
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Body Composition</h1>
            <p className="text-sm text-text-secondary">Beyond the scale</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">
            + Log
          </button>
        </div>

        {/* Snapshot cards */}
        {latest && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Weight', value: latest.weight_kg ? `${latest.weight_kg} kg` : '—', trend: trendArrow(latest.weight_kg, prev?.weight_kg, true) },
              { label: 'Body Fat', value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : '—', trend: trendArrow(latest.body_fat_pct, prev?.body_fat_pct, true) },
              { label: 'Lean Mass', value: latest.lean_body_mass_kg ? `${latest.lean_body_mass_kg} kg` : '—', trend: trendArrow(latest.lean_body_mass_kg, prev?.lean_body_mass_kg, false) },
              { label: 'BMI', value: latest.bmi ? String(latest.bmi) : '—', trend: '' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-border p-4">
                <div className="text-xs text-text-secondary mb-1">{card.label}</div>
                <div className="text-xl font-bold text-text-primary">{card.value} <span className="text-sm">{card.trend}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Log form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-6">
            <h3 className="font-semibold text-text-primary mb-4">Log Body Composition</h3>
            <div className="space-y-3">
              {[
                { key: 'weight_kg', label: 'Weight (kg)', placeholder: '70.5' },
                { key: 'body_fat_pct', label: 'Body Fat % (optional)', placeholder: 'Leave blank to estimate' },
                { key: 'muscle_mass_kg', label: 'Muscle Mass kg (optional)', placeholder: '52.0' },
                { key: 'hydration_pct', label: 'Hydration % (optional)', placeholder: '55.0' },
                { key: 'visceral_fat_level', label: 'Visceral Fat Level 1-20 (optional)', placeholder: '5' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-text-secondary block mb-1">{f.label}</label>
                  <input
                    type="number"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-text-secondary block mb-1">Notes</label>
                <input type="text" placeholder="Morning, fasted..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-primary bg-surface" />
              </div>
              <button onClick={save} disabled={saving || !form.weight_kg} className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        )}

        {/* Analysis */}
        {latest && (
          <div className="space-y-3 mb-6">
            {latest.bmi && (() => {
              const cat = bmiCategory(latest.bmi)
              return (
                <div className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-text-primary">BMI</span>
                    <span className={`font-bold ${cat?.color}`}>{latest.bmi} · {cat?.label}</span>
                  </div>
                  <p className="text-xs text-text-secondary">Note: BMI doesn't distinguish muscle from fat. Body fat % is more accurate.</p>
                </div>
              )
            })()}
            {latest.bmr_kcal && (
              <div className="bg-white rounded-2xl border border-border p-4">
                <div className="font-semibold text-text-primary mb-1">Metabolic Rate</div>
                <div className="flex gap-4">
                  <div><div className="text-xs text-text-secondary">BMR (rest)</div><div className="font-bold text-text-primary">{latest.bmr_kcal} kcal</div></div>
                  <div><div className="text-xs text-text-secondary">Light activity</div><div className="font-bold text-text-primary">{Math.round(latest.bmr_kcal * 1.375)} kcal</div></div>
                  <div><div className="text-xs text-text-secondary">Moderate</div><div className="font-bold text-text-primary">{Math.round(latest.bmr_kcal * 1.55)} kcal</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weight trend chart */}
        {entries.length >= 2 && (
          <div className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-3">Weight Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={[...entries].reverse().map(e => ({
                date: new Date(e.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                weight: e.weight_kg,
                fat: e.body_fat_pct,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v} kg`, 'Weight']}
                />
                <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History table */}
        {entries.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-text-primary">History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface">
                  <tr>
                    {['Date', 'Weight', 'BF%', 'Lean', 'BMI'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs text-text-secondary font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 10).map(e => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-3 py-2 text-text-secondary">{new Date(e.recorded_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2 font-medium text-text-primary">{e.weight_kg ?? '—'}</td>
                      <td className="px-3 py-2 text-text-primary">{e.body_fat_pct ? `${e.body_fat_pct}%` : '—'}</td>
                      <td className="px-3 py-2 text-text-primary">{e.lean_body_mass_kg ?? '—'}</td>
                      <td className="px-3 py-2 text-text-primary">{e.bmi ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {entries.length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">⚖️</div>
            <h3 className="font-semibold text-text-primary mb-1">No data yet</h3>
            <p className="text-text-secondary text-sm">Log your first entry to start tracking body composition</p>
            <button onClick={() => setShowForm(true)} className="mt-4 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm">Log Entry</button>
          </div>
        )}
      </div>
    </div>
  )
}
