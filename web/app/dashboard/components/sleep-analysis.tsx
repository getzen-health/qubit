'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SleepData {
  awake: number
  rem: number
  light: number
  deep: number
  totalHours: number
  quality: number
}

const COLORS = ['#EF4444', '#8B5CF6', '#3B82F6', '#1E3A8A']

export function SleepAnalysis({ data }: { data: SleepData }) {
  const chartData = [
    { name: 'Awake', value: data.awake, color: COLORS[0] },
    { name: 'REM', value: data.rem, color: COLORS[1] },
    { name: 'Light', value: data.light, color: COLORS[2] },
    { name: 'Deep', value: data.deep, color: COLORS[3] },
  ].filter(d => d.value > 0)

  const totalMinutes = data.awake + data.rem + data.light + data.deep

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sleep Analysis</h3>
          <p className="text-sm text-gray-500">Last night&apos;s breakdown</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.totalHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-500">Total sleep</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${Math.round(value)} min`}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {chartData.map((stage) => (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{stage.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(stage.value)} min ({Math.round((stage.value / totalMinutes) * 100)}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(stage.value / totalMinutes) * 100}%`, backgroundColor: stage.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sleep Quality Indicator */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Sleep Quality Score</div>
              <div className="text-xs text-gray-500">Based on duration and stages</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-500">{data.quality}/100</div>
        </div>
      </div>
    </div>
  )
}

export function SleepTrend({ data }: { data: { date: string; hours: number; quality: number }[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">7-Day Sleep Trend</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-500 transition-all hover:opacity-80"
              style={{ height: `${(day.hours / 10) * 100}%` }}
              title={`${day.hours.toFixed(1)}h`}
            />
            <span className="text-xs text-gray-500">{day.date}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">Avg: {(data.reduce((a, b) => a + b.hours, 0) / data.length).toFixed(1)}h</span>
        <span className="text-gray-500">Goal: 8h</span>
      </div>
    </div>
  )
}
