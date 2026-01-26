'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface StrainData {
  score: number // 0-21 scale like Whoop
  cardiovascular: number
  muscular: number
  calories: number
  duration: number // active minutes
  peakHR: number
  avgHR: number
}

export function StrainGauge({ data }: { data: StrainData }) {
  const getStrainColor = (score: number) => {
    if (score <= 7) return { color: '#3B82F6', label: 'Light', bg: 'from-blue-500 to-blue-600' }
    if (score <= 13) return { color: '#22C55E', label: 'Moderate', bg: 'from-green-500 to-green-600' }
    if (score <= 17) return { color: '#F97316', label: 'High', bg: 'from-orange-500 to-orange-600' }
    return { color: '#EF4444', label: 'Overreaching', bg: 'from-red-500 to-red-600' }
  }

  const strain = getStrainColor(data.score)
  const percentage = (data.score / 21) * 100

  return (
    <div className={`bg-gradient-to-br ${strain.bg} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[...Array(10)].map((_, i) => (
            <circle key={i} cx={50} cy={50} r={5 + i * 5} fill="none" stroke="white" strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-white/80 uppercase tracking-wide">Daily Strain</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold">{data.score.toFixed(1)}</span>
              <span className="text-xl text-white/70">/ 21</span>
            </div>
            <span className="text-sm text-white/80 mt-1">{strain.label}</span>
          </div>
          <div className="w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="35" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.2} 220`}
                className="transition-all duration-1000"
              />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-2xl font-bold">{data.calories}</div>
            <div className="text-xs text-white/70">Calories Burned</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-2xl font-bold">{data.duration}</div>
            <div className="text-xs text-white/70">Active Minutes</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-2xl font-bold">{data.peakHR}</div>
            <div className="text-xs text-white/70">Peak HR</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-2xl font-bold">{data.avgHR}</div>
            <div className="text-xs text-white/70">Avg HR</div>
          </div>
        </div>

        {/* Strain breakdown */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70">Cardiovascular</span>
            <span className="font-medium">{data.cardiovascular.toFixed(1)}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-white rounded-full" style={{ width: `${(data.cardiovascular / 21) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/70">Muscular</span>
            <span className="font-medium">{data.muscular.toFixed(1)}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${(data.muscular / 21) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface RecoveryData {
  score: number // 0-100
  hrv: number
  restingHR: number
  sleepPerformance: number
  sleepConsistency: number
  respiratoryRate: number
  skinTemp: number // deviation from baseline
  bloodOxygen: number
}

export function RecoveryScore({ data }: { data: RecoveryData }) {
  const getRecoveryStatus = (score: number) => {
    if (score >= 67) return { label: 'Green', color: '#22C55E', bg: 'from-green-500 to-emerald-600', advice: 'Peak performance day. Push yourself!' }
    if (score >= 34) return { label: 'Yellow', color: '#EAB308', bg: 'from-yellow-500 to-amber-600', advice: 'Moderate intensity recommended.' }
    return { label: 'Red', color: '#EF4444', bg: 'from-red-500 to-rose-600', advice: 'Focus on recovery today.' }
  }

  const status = getRecoveryStatus(data.score)

  return (
    <div className={`bg-gradient-to-br ${status.bg} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden`}>
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white/80 uppercase tracking-wide">Recovery</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold">{data.score}%</span>
            </div>
            <p className="text-sm text-white/80 mt-2 max-w-[200px]">{status.advice}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full`} style={{ backgroundColor: status.color }} />
            </div>
            <span className="text-xs mt-2 text-white/80">{status.label} Zone</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <MetricPill label="HRV" value={`${data.hrv}ms`} />
          <MetricPill label="RHR" value={`${data.restingHR}bpm`} />
          <MetricPill label="SpO2" value={`${data.bloodOxygen}%`} />
          <MetricPill label="Sleep" value={`${data.sleepPerformance}%`} />
          <MetricPill label="Resp" value={`${data.respiratoryRate}/min`} />
          <MetricPill label="Temp" value={`${data.skinTemp > 0 ? '+' : ''}${data.skinTemp}°`} />
        </div>
      </div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2 text-center">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-xs text-white/70">{label}</div>
    </div>
  )
}

export function StrainTrend({ data }: { data: { date: string; strain: number; recovery: number }[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strain vs Recovery</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="strainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Area type="monotone" dataKey="strain" stroke="#F97316" fill="url(#strainGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="recovery" stroke="#22C55E" fill="url(#recoveryGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Strain</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Recovery</span>
        </div>
      </div>
    </div>
  )
}

export function TrainingLoad({ weeklyLoad, optimalRange }: { weeklyLoad: number[]; optimalRange: [number, number] }) {
  const currentLoad = weeklyLoad[weeklyLoad.length - 1]
  const previousLoad = weeklyLoad[weeklyLoad.length - 2] || currentLoad
  const trend = currentLoad - previousLoad

  const getLoadStatus = () => {
    if (currentLoad < optimalRange[0]) return { label: 'Detraining', color: 'text-blue-500', advice: 'Increase training to maintain fitness' }
    if (currentLoad > optimalRange[1]) return { label: 'Overreaching', color: 'text-red-500', advice: 'Consider reducing intensity' }
    return { label: 'Optimal', color: 'text-green-500', advice: 'Training load is in the sweet spot' }
  }

  const status = getLoadStatus()
  const maxLoad = Math.max(...weeklyLoad, optimalRange[1])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Load</h3>
        <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
      </div>

      <div className="flex items-end gap-1 h-32 mb-4">
        {weeklyLoad.map((load, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t transition-all ${
                i === weeklyLoad.length - 1 ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              style={{ height: `${(load / maxLoad) * 100}%` }}
            />
            <span className="text-xs text-gray-400">W{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Optimal range indicator */}
      <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
        <div
          className="absolute h-full bg-green-200 dark:bg-green-900/50"
          style={{
            left: `${(optimalRange[0] / maxLoad) * 100}%`,
            width: `${((optimalRange[1] - optimalRange[0]) / maxLoad) * 100}%`,
          }}
        />
        <div
          className="absolute h-full w-1 bg-purple-500"
          style={{ left: `${(currentLoad / maxLoad) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Current: {currentLoad}</span>
        <span className={trend >= 0 ? 'text-green-500' : 'text-red-500'}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} from last week
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-2">{status.advice}</p>
    </div>
  )
}
