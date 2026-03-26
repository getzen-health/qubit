"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DayData {
  day: string
  steps: number
  workoutMins: number
  sleepHours: number
}

interface WeeklyActivityChartProps {
  data: DayData[]
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  return (
    <div className="rounded-xl border border-border p-5">
      <h2 className="font-semibold mb-4">This Week</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={2}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="steps" orientation="left" tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
          <YAxis yAxisId="mins" orientation="right" tick={{ fontSize: 10 }} unit="m" axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'Steps') return [`${value.toLocaleString()}`, 'Steps']
              if (name === 'Workout') return [`${value}min`, 'Workout']
              if (name === 'Sleep') return [`${value}h`, 'Sleep']
              return [value, name]
            }}
          />
          <Legend iconType="circle" iconSize={8} />
          <Bar yAxisId="steps" dataKey="steps" name="Steps" fill="#3b82f6" radius={[3,3,0,0]} maxBarSize={20} />
          <Bar yAxisId="mins" dataKey="workoutMins" name="Workout" fill="#10b981" radius={[3,3,0,0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
