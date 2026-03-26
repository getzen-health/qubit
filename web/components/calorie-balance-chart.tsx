'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CalorieBalanceChart() {
  const [data, setData] = useState<any[]>([])
  const [weeklyAvg, setWeeklyAvg] = useState(0)
  const [calorieBudget, setCalorieBudget] = useState(2000)
  useEffect(() => {
    fetch('/api/calorie-balance').then(r => r.json()).then(res => {
      setData(res.days)
      setWeeklyAvg(res.weeklyAvg)
      setCalorieBudget(res.calorieBudget)
    })
  }, [])

  const dayAbbr = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString(undefined, { weekday: 'short' })
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <XAxis dataKey="date" tickFormatter={dayAbbr} />
          <YAxis />
          <Tooltip formatter={(v: any) => Math.round(v)} />
          <Legend />
          <Bar dataKey="consumed" name="Consumed" fill="#8884d8" />
          <Bar dataKey="burnedBMR" name="Burned+BMR" data={data.map(d => d.bmr + d.burned)} fill="#82ca9d" />
          <Bar dataKey="balance" name="Balance" data={data.map(d => d.balance)}
            fill={d => d.surplus ? '#ef4444' : '#22c55e'}
            isAnimationActive={false}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center mt-2 text-sm text-gray-500">
        Weekly avg: <span className={weeklyAvg > 0 ? 'text-red-500' : 'text-green-600'}>{weeklyAvg > 0 ? '+' : ''}{weeklyAvg} kcal</span> (Budget: {calorieBudget} kcal)
      </div>
    </div>
  )
}
