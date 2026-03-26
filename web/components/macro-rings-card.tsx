'use client'
import { useEffect, useState } from 'react'

interface MacroTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface MacroTargets {
  target_calories: number
  target_protein_g: number
  target_carbs_g: number
  target_fat_g: number
}

function Ring({ value, max, color, label, unit }: { value: number; max: number; color: string; label: string; unit: string }) {
  const size = 80
  const strokeWidth = 8
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(value / (max || 1), 1)
  const dash = pct * circumference
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#333" strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-text-primary">{Math.round(value)}</span>
          <span className="text-[9px] text-text-secondary">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-text-secondary font-medium">{label}</span>
      <span className="text-[10px] text-text-secondary">/ {max}{unit}</span>
    </div>
  )
}

export function MacroRingsCard() {
  const [totals, setTotals] = useState<MacroTotals>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 })
  const [targets, setTargets] = useState<MacroTargets>({ target_calories: 2000, target_protein_g: 150, target_carbs_g: 250, target_fat_g: 65 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/nutrition/today').then(r => r.json()),
      fetch('/api/settings/nutrition').then(r => r.json()),
    ]).then(([todayData, settingsData]) => {
      if (todayData.data) setTotals(todayData.data)
      if (settingsData.data) setTargets(settingsData.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-32 animate-pulse bg-surface rounded-2xl" />

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Today&apos;s Macros</h3>
        <a href="/food-diary" className="text-xs text-primary hover:underline">Log food →</a>
      </div>
      <div className="flex justify-around">
        <Ring value={totals.calories} max={targets.target_calories} color="#7c3aed" label="Calories" unit="kcal" />
        <Ring value={totals.protein_g} max={targets.target_protein_g} color="#3b82f6" label="Protein" unit="g" />
        <Ring value={totals.carbs_g} max={targets.target_carbs_g} color="#f59e0b" label="Carbs" unit="g" />
        <Ring value={totals.fat_g} max={targets.target_fat_g} color="#ec4899" label="Fat" unit="g" />
      </div>
    </div>
  )
}
