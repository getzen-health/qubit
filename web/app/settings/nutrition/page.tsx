'use client'
import { useState, useEffect } from 'react'

export default function NutritionSettingsPage() {
  const [form, setForm] = useState({ target_calories: 2000, target_protein_g: 150, target_carbs_g: 250, target_fat_g: 65 })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/nutrition').then(r => r.json()).then(d => {
      if (d.data) setForm(d.data)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    await fetch('/api/settings/nutrition', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Nutrition Targets</h1>
      {loading ? <div className="animate-pulse h-48 bg-surface rounded-xl" /> : (
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          {([
            { key: 'target_calories', label: 'Daily Calories', unit: 'kcal', min: 1000, max: 5000 },
            { key: 'target_protein_g', label: 'Protein', unit: 'g', min: 10, max: 400 },
            { key: 'target_carbs_g', label: 'Carbohydrates', unit: 'g', min: 20, max: 600 },
            { key: 'target_fat_g', label: 'Fat', unit: 'g', min: 10, max: 200 },
          ] as const).map(({ key, label, unit, min, max }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-text-secondary mb-1">{label} ({unit})</label>
              <input
                type="number" min={min} max={max}
                value={form[key]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text-primary"
              />
            </div>
          ))}
          <button onClick={handleSave} className="w-full py-3 bg-primary text-white rounded-xl font-semibold mt-2">
            {saved ? 'Saved ✓' : 'Save Targets'}
          </button>
        </div>
      )}
    </div>
  )
}
