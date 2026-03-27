'use client'

import React, { useMemo } from 'react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface BodyBatteryData {
  current: number // 0-100
  high: number
  low: number
  charged: number // how much recharged during sleep
  drained: number // how much drained during day
}

function BodyBatteryComponent({ data }: { data: BodyBatteryData }) {
  const getBatteryColor = useMemo(() => (level: number) => {
    if (level >= 75) return { color: '#22C55E', label: 'High', gradient: 'from-green-400 to-green-600', textClass: 'text-green-400' }
    if (level >= 50) return { color: '#EAB308', label: 'Moderate', gradient: 'from-yellow-400 to-yellow-600', textClass: 'text-yellow-400' }
    if (level >= 25) return { color: '#F97316', label: 'Low', gradient: 'from-orange-400 to-orange-600', textClass: 'text-orange-400' }
    return { color: '#EF4444', label: 'Critical', gradient: 'from-red-400 to-red-600', textClass: 'text-red-400' }
  }, [])

  const battery = useMemo(() => getBatteryColor(data.current), [getBatteryColor, data.current])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Body Battery</h3>

      <div className="flex items-center gap-6">
        {/* Battery visualization */}
        <div className="relative">
          <div className="w-24 h-40 rounded-2xl border-4 border-gray-300 dark:border-gray-600 relative overflow-hidden">
            {/* Battery cap */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-gray-300 dark:bg-gray-600 rounded-t-lg" />

            {/* Fill level */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${battery.gradient} transition-all duration-1000`}
              style={{ height: `${data.current}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>

            {/* Level markers */}
            {[25, 50, 75].map((level) => (
              <div
                key={level}
                className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                style={{ bottom: `${level}%` }}
              />
            ))}
          </div>
          <div className="text-center mt-2">
            <span className={`text-3xl font-bold ${battery.textClass}`}>{data.current}</span>
            <span className="text-gray-500">%</span>
            <div className={`text-xs font-medium mt-0.5 ${battery.textClass}`}>{battery.label}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Charged</span>
            </div>
            <span className="font-bold text-green-600 dark:text-green-400">+{data.charged}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔋</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Drained</span>
            </div>
            <span className="font-bold text-red-600 dark:text-red-400">-{data.drained}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{data.high}</div>
              <div className="text-xs text-gray-500">Today&apos;s High</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{data.low}</div>
              <div className="text-xs text-gray-500">Today&apos;s Low</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BodyBatteryTrendComponent({ data }: { data: { time: string; level: number }[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Battery Timeline</h3>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            formatter={(value: number) => [`${value}%`, 'Body Battery']}
          />
          <ReferenceLine y={25} stroke="#EF4444" strokeDasharray="3 3" />
          <ReferenceLine y={75} stroke="#22C55E" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="level" stroke="#8B5CF6" fill="url(#batteryGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface StressData {
  current: number // 0-100
  restTime: number // minutes
  stressTime: number // minutes
  average: number
  timeline: { time: string; level: number }[]
}

function StressLevelComponent({ data }: { data: StressData }) {
  const getStressStatus = (level: number) => {
    if (level <= 25) return { label: 'Resting', color: '#3B82F6', icon: '😌' }
    if (level <= 50) return { label: 'Low', color: '#22C55E', icon: '🙂' }
    if (level <= 75) return { label: 'Medium', color: '#F59E0B', icon: '😐' }
    return { label: 'High', color: '#EF4444', icon: '😰' }
  }

  const status = getStressStatus(data.current)
  const totalTime = Math.max(data.restTime + data.stressTime, 1) // guard against div-by-zero

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stress</h3>
        <span className="text-3xl">{status.icon}</span>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" className="dark:stroke-gray-700" />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={status.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${data.current * 2.51} 251`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.current}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium mb-2" style={{ color: status.color }}>{status.label} Stress</div>
          <div className="text-xs text-gray-500 mb-3">Average today: {data.average}</div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(data.restTime / totalTime) * 100}%` }}
              title={`Rest: ${data.restTime} min`}
            />
            <div
              className="h-full bg-orange-500"
              style={{ width: `${(data.stressTime / totalTime) * 100}%` }}
              title={`Stress: ${data.stressTime} min`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Rest: {data.restTime}m</span>
            <span>Stress: {data.stressTime}m</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data.timeline}>
          <defs>
            <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} interval="preserveStartEnd" />
          <Area type="monotone" dataKey="level" stroke="#F97316" fill="url(#stressGradient)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface ReadinessData {
  score: number // 0-100
  factors: {
    sleep: number
    recovery: number
    activity: number
    hrv: number
    restingHR: number
  }
  recommendation: string
}

function ReadinessComponent({ data }: { data: ReadinessData }) {
  const getReadinessStatus = (score: number) => {
    if (score >= 85) return { label: 'Optimal', color: '#22C55E', bg: 'from-green-500 to-emerald-600' }
    if (score >= 70) return { label: 'Good', color: '#3B82F6', bg: 'from-blue-500 to-cyan-600' }
    if (score >= 50) return { label: 'Fair', color: '#F59E0B', bg: 'from-yellow-500 to-orange-500' }
    return { label: 'Low', color: '#EF4444', bg: 'from-red-500 to-rose-600' }
  }

  const status = getReadinessStatus(data.score)

  const factors = [
    { name: 'Sleep', value: data.factors.sleep, icon: '😴' },
    { name: 'Recovery', value: data.factors.recovery, icon: '💪' },
    { name: 'Activity', value: data.factors.activity, icon: '🏃' },
    { name: 'HRV', value: data.factors.hrv, icon: '❤️' },
    { name: 'RHR', value: data.factors.restingHR, icon: '💓' },
  ]

  return (
    <div className={`bg-gradient-to-br ${status.bg} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-white/80 uppercase tracking-wide">Readiness Score</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-5xl font-bold">{data.score}</span>
            <span className="text-xl text-white/70">/ 100</span>
          </div>
          <span className="text-sm text-white/80">{status.label}</span>
        </div>
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {factors.map((factor) => (
          <div key={factor.name} className="text-center">
            <div className="text-xl mb-1">{factor.icon}</div>
            <div className="text-sm font-bold">{factor.value}</div>
            <div className="text-xs text-white/60">{factor.name}</div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white/10 rounded-xl">
        <p className="text-sm text-white/90">{data.recommendation}</p>
      </div>
    </div>
  )
}

function SleepDebtComponent({ current, ideal, history }: { current: number; ideal: number; history: { day: string; debt: number }[] }) {
  const debtHours = ideal - current
  const isInDebt = debtHours > 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sleep Debt</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isInDebt ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {isInDebt ? `${debtHours.toFixed(1)}h behind` : 'All caught up!'}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-4xl mb-1">😴</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{current}h</div>
          <div className="text-xs text-gray-500">Last night</div>
        </div>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2">
            <span className="text-gray-400">vs</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-1">🎯</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{ideal}h</div>
          <div className="text-xs text-gray-500">Your need</div>
        </div>
      </div>

      <div className="flex items-end gap-1 h-16">
        {history.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t transition-all ${
                day.debt > 0 ? 'bg-red-400' : 'bg-green-400'
              }`}
              style={{ height: `${Math.min(Math.abs(day.debt) * 10, 100)}%` }}
            />
            <span className="text-xs text-gray-400">{day.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const BodyBattery = React.memo(BodyBatteryComponent)
export const BodyBatteryTrend = React.memo(BodyBatteryTrendComponent)
export const StressLevel = React.memo(StressLevelComponent)
export const Readiness = React.memo(ReadinessComponent)
export const SleepDebt = React.memo(SleepDebtComponent)
