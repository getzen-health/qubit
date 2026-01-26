'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface HeartRateZone {
  name: string
  min: number
  max: number
  minutes: number
  color: string
  description: string
}

const DEFAULT_ZONES: HeartRateZone[] = [
  { name: 'Rest', min: 0, max: 60, minutes: 0, color: '#6B7280', description: 'Recovery' },
  { name: 'Fat Burn', min: 60, max: 100, minutes: 0, color: '#3B82F6', description: 'Light activity' },
  { name: 'Cardio', min: 100, max: 140, minutes: 0, color: '#22C55E', description: 'Moderate' },
  { name: 'Peak', min: 140, max: 180, minutes: 0, color: '#F97316', description: 'Intense' },
  { name: 'Max', min: 180, max: 220, minutes: 0, color: '#EF4444', description: 'Maximum effort' },
]

export function HeartRateZones({ zones = DEFAULT_ZONES }: { zones?: HeartRateZone[] }) {
  const totalMinutes = zones.reduce((sum, z) => sum + z.minutes, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heart Rate Zones</h3>
          <p className="text-sm text-gray-500">Today&apos;s time in each zone</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">Live</span>
        </div>
      </div>

      {/* Zone bars */}
      <div className="space-y-3">
        {zones.map((zone) => {
          const percentage = totalMinutes > 0 ? (zone.minutes / totalMinutes) * 100 : 0

          return (
            <div key={zone.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{zone.name}</span>
                  <span className="text-xs text-gray-400">({zone.min}-{zone.max} bpm)</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{zone.minutes} min</span>
              </div>
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 group-hover:opacity-80 flex items-center px-2"
                  style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: zone.color }}
                >
                  {percentage > 15 && (
                    <span className="text-xs font-medium text-white">{percentage.toFixed(0)}%</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">72</div>
          <div className="text-xs text-gray-500">Resting HR</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">142</div>
          <div className="text-xs text-gray-500">Max Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">89</div>
          <div className="text-xs text-gray-500">Average</div>
        </div>
      </div>
    </div>
  )
}

export function HeartRateChart({ data }: { data: { time: string; bpm: number }[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heart Rate Today</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-500">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-500">Elevated</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
          <YAxis domain={[40, 180]} stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
          />
          <Area
            type="monotone"
            dataKey="bpm"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#heartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HRVCard({ current, average, trend }: { current: number; average: number; trend: 'up' | 'down' | 'stable' }) {
  const status = current >= average ? 'good' : 'low'

  return (
    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-purple-200">Heart Rate Variability</h3>
          <div className="text-4xl font-bold mt-2">{current} ms</div>
          <div className="text-sm text-purple-200 mt-1">7-day avg: {average} ms</div>
        </div>
        <div className="p-3 bg-white/20 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend === 'up' && <span className="text-green-300">↑ Improving</span>}
        {trend === 'down' && <span className="text-red-300">↓ Declining</span>}
        {trend === 'stable' && <span className="text-purple-200">→ Stable</span>}
        <span className="text-purple-200">•</span>
        <span className={status === 'good' ? 'text-green-300' : 'text-yellow-300'}>
          {status === 'good' ? 'Recovery on track' : 'Consider rest'}
        </span>
      </div>
    </div>
  )
}
