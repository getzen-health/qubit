"use client"
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#ef4444',
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export default function NutritionWeeklyChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/food-diary/weekly').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])
  if (loading) return <div className="h-48 flex items-center justify-center">Loading...</div>
  const chartData = data.map((d: any) => ({
    day: getDayLabel(d.date),
    protein: d.protein_g,
    carbs: d.carbs_g,
    fat: d.fat_g,
    calories: d.calories,
  }))
  const avgCalories = data.length ? Math.round(data.reduce((sum: number, d: any) => sum + d.calories, 0) / data.length) : 0
  return (
    <div className="rounded-xl border border-border p-5">
      <h2 className="font-semibold mb-4">Weekly Nutrition</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} stackOffset="sign">
          <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number, n: string) => [`${v}g`, n.charAt(0).toUpperCase()+n.slice(1)]} />
          <Legend iconType="circle" iconSize={10} />
          <Bar dataKey="protein" name="Protein" stackId="a" fill={COLORS.protein} />
          <Bar dataKey="carbs" name="Carbs" stackId="a" fill={COLORS.carbs} />
          <Bar dataKey="fat" name="Fat" stackId="a" fill={COLORS.fat} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center text-sm text-muted-foreground">Avg daily calories: <span className="font-bold">{avgCalories}</span></div>
    </div>
  )
}
