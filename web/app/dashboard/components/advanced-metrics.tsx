'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

interface RespiratoryData {
  current: number
  average: number
  min: number
  max: number
  trend: { time: string; rate: number }[]
}

export function RespiratoryRate({ data }: { data: RespiratoryData }) {
  const isNormal = data.current >= 12 && data.current <= 20

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Respiratory Rate</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isNormal ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {isNormal ? 'Normal' : 'Attention'}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">{data.current}</div>
          <div className="text-sm text-gray-500">breaths/min</div>
        </div>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={data.trend}>
              <Line type="monotone" dataKey="rate" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-500">{data.min}</div>
          <div className="text-xs text-gray-500">Min</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-500">{data.average}</div>
          <div className="text-xs text-gray-500">Average</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-500">{data.max}</div>
          <div className="text-xs text-gray-500">Max</div>
        </div>
      </div>
    </div>
  )
}

interface SpO2Data {
  current: number
  average: number
  lowest: number
  timeline: { time: string; value: number }[]
}

export function BloodOxygen({ data }: { data: SpO2Data }) {
  const getStatus = (value: number) => {
    if (value >= 95) return { label: 'Normal', color: '#22C55E' }
    if (value >= 90) return { label: 'Low', color: '#F59E0B' }
    return { label: 'Critical', color: '#EF4444' }
  }

  const status = getStatus(data.current)

  return (
    <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white/80">Blood Oxygen</h3>
          <div className="text-4xl font-bold mt-2">{data.current}%</div>
          <div className="text-sm text-white/70">SpO2</div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-2xl">🫁</span>
        </div>
      </div>

      <div className="h-16 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.timeline}>
            <Line type="monotone" dataKey="value" stroke="white" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/15 rounded-lg p-2 text-center">
          <div className="font-bold">{data.average}%</div>
          <div className="text-xs text-white/70">Average</div>
        </div>
        <div className="bg-white/15 rounded-lg p-2 text-center">
          <div className="font-bold">{data.lowest}%</div>
          <div className="text-xs text-white/70">Lowest</div>
        </div>
      </div>
    </div>
  )
}

interface SkinTempData {
  current: number
  baseline: number
  deviation: number
  history: { date: string; temp: number }[]
}

export function SkinTemperature({ data }: { data: SkinTempData }) {
  const deviation = data.current - data.baseline
  const isElevated = deviation > 0.5

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skin Temperature</h3>
        <div className="text-2xl">🌡️</div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.current.toFixed(1)}°</div>
          <div className="text-sm text-gray-500">Current</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isElevated ? 'bg-red-100 text-red-600' : Math.abs(deviation) < 0.3 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`}>
          {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}° from baseline
        </div>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={data.history}>
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
          <Line type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface WellnessData {
  sleep: number
  activity: number
  nutrition: number
  stress: number
  recovery: number
  mindfulness: number
}

export function WellnessRadar({ data }: { data: WellnessData }) {
  const chartData = [
    { metric: 'Sleep', value: data.sleep },
    { metric: 'Activity', value: data.activity },
    { metric: 'Nutrition', value: data.nutrition },
    { metric: 'Stress', value: 100 - data.stress }, // Invert stress (lower is better)
    { metric: 'Recovery', value: data.recovery },
    { metric: 'Mindfulness', value: data.mindfulness },
  ]

  const overallScore = Math.round(Object.values(data).reduce((a, b) => a + (b === data.stress ? 100 - b : b), 0) / 6)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wellness Score</h3>
        <div className="text-2xl font-bold text-purple-500">{overallScore}</div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Radar
            name="Wellness"
            dataKey="value"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MenstrualData {
  currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  dayOfCycle: number
  cycleLength: number
  nextPeriod: number // days until
  fertileWindow: { start: number; end: number } // days from now
  symptoms: string[]
}

export function MenstrualCycle({ data }: { data: MenstrualData }) {
  const phases = {
    menstrual: { label: 'Menstrual', color: '#EF4444', icon: '🔴', advice: 'Rest and gentle movement recommended' },
    follicular: { label: 'Follicular', color: '#3B82F6', icon: '🔵', advice: 'Great time for high-intensity workouts' },
    ovulation: { label: 'Ovulation', color: '#22C55E', icon: '🟢', advice: 'Peak energy - push your limits!' },
    luteal: { label: 'Luteal', color: '#F59E0B', icon: '🟡', advice: 'Focus on strength and recovery' },
  }

  const currentPhase = phases[data.currentPhase]
  const cycleProgress = (data.dayOfCycle / data.cycleLength) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cycle Tracking</h3>
        <span className="text-2xl">{currentPhase.icon}</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#E5E7EB" strokeWidth="6" className="dark:stroke-gray-700" />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke={currentPhase.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${cycleProgress * 2.2} 220`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-white">Day {data.dayOfCycle}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white" style={{ color: currentPhase.color }}>
            {currentPhase.label} Phase
          </div>
          <p className="text-sm text-gray-500 mt-1">{currentPhase.advice}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{data.nextPeriod} days</div>
          <div className="text-xs text-gray-500">Until next period</div>
        </div>
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
          <div className="text-lg font-bold text-green-600">{data.fertileWindow.start}-{data.fertileWindow.end} days</div>
          <div className="text-xs text-gray-500">Fertile window</div>
        </div>
      </div>

      {data.symptoms.length > 0 && (
        <div>
          <div className="text-sm text-gray-500 mb-2">Logged symptoms</div>
          <div className="flex flex-wrap gap-2">
            {data.symptoms.map((symptom, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                {symptom}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SocialData {
  friends: { name: string; avatar: string; steps: number }[]
  rank: number
  totalParticipants: number
  weeklyChallenge?: { name: string; progress: number }
}

export function Leaderboard({ data }: { data: SocialData }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Friends Leaderboard</h3>
        <span className="text-sm text-gray-500">This week</span>
      </div>

      <div className="space-y-3">
        {data.friends.slice(0, 5).map((friend, i) => (
          <div key={friend.name} className={`flex items-center gap-3 p-3 rounded-xl ${
            i === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
            i === 1 ? 'bg-gray-100 dark:bg-gray-700/50' :
            i === 2 ? 'bg-orange-50 dark:bg-orange-900/20' : ''
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i === 0 ? 'bg-yellow-400 text-yellow-900' :
              i === 1 ? 'bg-gray-300 text-gray-700' :
              i === 2 ? 'bg-orange-400 text-orange-900' :
              'bg-gray-200 text-gray-600'
            }`}>
              {i + 1}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
              {friend.avatar || friend.name[0]}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{friend.name}</div>
              <div className="text-sm text-gray-500">{friend.steps.toLocaleString()} steps</div>
            </div>
            {i === 0 && <span className="text-xl">👑</span>}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Your rank</span>
          <span className="font-bold text-purple-600">#{data.rank} of {data.totalParticipants}</span>
        </div>
      </div>
    </div>
  )
}

export function QuickActions() {
  const actions = [
    { icon: '🏃', label: 'Start Workout', color: 'from-green-500 to-emerald-600' },
    { icon: '🍎', label: 'Log Food', color: 'from-red-500 to-rose-600' },
    { icon: '💧', label: 'Add Water', color: 'from-blue-500 to-cyan-600' },
    { icon: '😴', label: 'Log Sleep', color: 'from-indigo-500 to-purple-600' },
    { icon: '💊', label: 'Medication', color: 'from-pink-500 to-rose-600' },
    { icon: '🧘', label: 'Meditate', color: 'from-purple-500 to-violet-600' },
    { icon: '📝', label: 'Journal', color: 'from-yellow-500 to-orange-600' },
    { icon: '🎯', label: 'Set Goal', color: 'from-teal-500 to-green-600' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className={`p-4 rounded-xl bg-gradient-to-br ${action.color} text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95`}
          >
            <div className="text-2xl mb-1">{action.icon}</div>
            <div className="text-xs font-medium">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function DailyTip({ tip, category }: { tip: string; category: string }) {
  const categoryStyles: Record<string, { icon: string; gradient: string }> = {
    sleep: { icon: '😴', gradient: 'from-indigo-500 to-purple-600' },
    nutrition: { icon: '🥗', gradient: 'from-green-500 to-teal-600' },
    fitness: { icon: '💪', gradient: 'from-orange-500 to-red-600' },
    mindfulness: { icon: '🧘', gradient: 'from-purple-500 to-pink-600' },
    recovery: { icon: '🛀', gradient: 'from-blue-500 to-cyan-600' },
  }

  const style = categoryStyles[category] || categoryStyles.fitness

  return (
    <div className={`bg-gradient-to-r ${style.gradient} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex items-start gap-4">
        <div className="text-4xl">{style.icon}</div>
        <div className="flex-1">
          <div className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">Daily Tip</div>
          <p className="text-lg font-medium">{tip}</p>
        </div>
      </div>
    </div>
  )
}
