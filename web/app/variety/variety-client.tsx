'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

interface Workout {
  workout_type: string
  start_time: string
  duration_minutes: number
  active_calories?: number | null
}

interface VarietyClientProps {
  workouts: Workout[]
}

// Workout categories and colors
const WORKOUT_META: Record<string, { emoji: string; color: string; category: string }> = {
  Running:             { emoji: '🏃', color: '#4ade80', category: 'Cardio' },
  Cycling:             { emoji: '🚴', color: '#60a5fa', category: 'Cardio' },
  Swimming:            { emoji: '🏊', color: '#22d3ee', category: 'Cardio' },
  Walking:             { emoji: '🚶', color: '#a3e635', category: 'Cardio' },
  Hiking:              { emoji: '🥾', color: '#84cc16', category: 'Cardio' },
  Rowing:              { emoji: '🚣', color: '#38bdf8', category: 'Cardio' },
  Elliptical:          { emoji: '🏃', color: '#34d399', category: 'Cardio' },
  'Stair Stepper':     { emoji: '🪜', color: '#10b981', category: 'Cardio' },
  'Strength Training': { emoji: '💪', color: '#f87171', category: 'Strength' },
  'Functional Strength Training': { emoji: '💪', color: '#ef4444', category: 'Strength' },
  'High Intensity Interval Training': { emoji: '⚡', color: '#fb923c', category: 'HIIT' },
  HIIT:                { emoji: '⚡', color: '#f97316', category: 'HIIT' },
  CrossFit:            { emoji: '⚡', color: '#f97316', category: 'HIIT' },
  Yoga:                { emoji: '🧘', color: '#c084fc', category: 'Mind-Body' },
  Pilates:             { emoji: '🤸', color: '#a78bfa', category: 'Mind-Body' },
  Stretching:          { emoji: '🤸', color: '#818cf8', category: 'Mind-Body' },
  Dance:               { emoji: '💃', color: '#f472b6', category: 'Other' },
  Boxing:              { emoji: '🥊', color: '#fb923c', category: 'Cardio' },
  Tennis:              { emoji: '🎾', color: '#facc15', category: 'Sports' },
  Basketball:          { emoji: '🏀', color: '#f97316', category: 'Sports' },
  Soccer:              { emoji: '⚽', color: '#4ade80', category: 'Sports' },
  Golf:                { emoji: '⛳', color: '#a3e635', category: 'Sports' },
}

const CATEGORY_COLORS: Record<string, string> = {
  Cardio:     '#4ade80',
  Strength:   '#f87171',
  HIIT:       '#fb923c',
  'Mind-Body': '#c084fc',
  Sports:     '#facc15',
  Other:      '#94a3b8',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getISO_Week(date: Date): string {
  const jan4 = new Date(date.getFullYear(), 0, 4)
  const weekNum = Math.ceil(((date.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `W${weekNum}`
}

export function VarietyClient({ workouts }: VarietyClientProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🏅</span>
        <h2 className="text-lg font-semibold text-text-primary">No workout data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import workouts from Apple Health or the Fitness app.
        </p>
      </div>
    )
  }

  // Count by type
  const typeCounts: Record<string, { count: number; minutes: number; calories: number }> = {}
  for (const w of workouts) {
    if (!typeCounts[w.workout_type]) typeCounts[w.workout_type] = { count: 0, minutes: 0, calories: 0 }
    typeCounts[w.workout_type].count++
    typeCounts[w.workout_type].minutes += w.duration_minutes
    typeCounts[w.workout_type].calories += w.active_calories ?? 0
  }

  const typeList = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([type, data]) => ({
      type,
      ...data,
      meta: WORKOUT_META[type] ?? { emoji: '⚡', color: '#94a3b8', category: 'Other' },
    }))

  // Category summary
  const catCounts: Record<string, number> = {}
  for (const t of typeList) {
    catCounts[t.meta.category] = (catCounts[t.meta.category] ?? 0) + t.count
  }
  const catList = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({ cat, count, color: CATEGORY_COLORS[cat] ?? '#94a3b8' }))

  // Pie data
  const pieData = typeList.slice(0, 8).map((t) => ({
    name: t.type,
    value: t.count,
    color: t.meta.color,
  }))

  // Weekly variety: unique types per week
  const weekTypes: Record<string, Set<string>> = {}
  const weekCats: Record<string, Set<string>> = {}
  for (const w of workouts) {
    const week = getISO_Week(new Date(w.start_time))
    if (!weekTypes[week]) { weekTypes[week] = new Set(); weekCats[week] = new Set() }
    weekTypes[week].add(w.workout_type)
    weekCats[week].add(WORKOUT_META[w.workout_type]?.category ?? 'Other')
  }

  const weekData = Object.entries(weekTypes)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, types]) => ({
      week,
      uniqueTypes: types.size,
      uniqueCats: weekCats[week].size,
    }))

  // Variety score: avg unique types per week
  const avgTypesPerWeek = weekData.length > 0
    ? (weekData.reduce((s, w) => s + w.uniqueTypes, 0) / weekData.length).toFixed(1)
    : '0'

  const uniqueTypes = Object.keys(typeCounts).length

  function varietyGrade(avgTypes: number): { grade: string; color: string; advice: string } {
    if (avgTypes >= 4) return { grade: 'A', color: 'text-green-400', advice: 'Excellent variety! You\'re targeting multiple fitness domains each week.' }
    if (avgTypes >= 3) return { grade: 'B', color: 'text-blue-400', advice: 'Good variety. Consider adding one more type for broader cross-training.' }
    if (avgTypes >= 2) return { grade: 'C', color: 'text-yellow-400', advice: 'Moderate variety. Try mixing in strength, flexibility, or a new cardio type.' }
    return { grade: 'D', color: 'text-orange-400', advice: 'Low variety. Diversifying your routine reduces injury risk and improves overall fitness.' }
  }

  const grade = varietyGrade(parseFloat(avgTypesPerWeek))

  return (
    <div className="space-y-6">
      {/* Variety score */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold">Variety Score</p>
            <p className="text-4xl font-bold mt-1 text-text-primary">{avgTypesPerWeek} <span className="text-lg text-text-secondary">types/week avg</span></p>
          </div>
          <div className={`text-5xl font-black ${grade.color}`}>{grade.grade}</div>
        </div>
        <p className="text-sm text-text-secondary">{grade.advice}</p>
        <div className="flex gap-4 mt-3 text-xs text-text-secondary">
          <span className="font-medium text-text-primary">{uniqueTypes}</span> distinct workout types
          <span className="font-medium text-text-primary">{workouts.length}</span> total sessions
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {catList.map(({ cat, count, color }) => (
          <div key={cat} className="bg-surface rounded-xl border border-border p-4">
            <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${(count / workouts.length) * 100}%`, backgroundColor: color }} />
            </div>
            <p className="text-lg font-bold" style={{ color }}>{count}</p>
            <p className="text-xs text-text-secondary">{cat}</p>
            <p className="text-xs text-text-secondary opacity-60">{Math.round((count / workouts.length) * 100)}% of sessions</p>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Workout Type Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={1} stroke="rgba(0,0,0,0.3)">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'sessions']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {typeList.slice(0, 8).map((t) => (
                <div key={t.type} className="flex items-center gap-2 text-xs">
                  <span className="text-sm">{t.meta.emoji}</span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.meta.color }} />
                  <span className="text-text-secondary flex-1 truncate">{t.type}</span>
                  <span className="font-mono text-text-primary shrink-0">{t.count}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekly unique types */}
      {weekData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Unique Types per Week</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} domain={[0, 7]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [v, name === 'uniqueTypes' ? 'Unique types' : 'Categories']} />
              <Bar dataKey="uniqueTypes" name="Unique types" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="uniqueCats" name="Categories" fill="#818cf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-400" /> Workout types</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-indigo-400" /> Categories</div>
          </div>
        </div>
      )}

      {/* Type breakdown table */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">All Workout Types</h2>
        {typeList.map((t) => (
          <div key={t.type} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{t.meta.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{t.type}</p>
              <p className="text-xs text-text-secondary">{t.meta.category} · {fmtDuration(t.minutes)} total</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: t.meta.color }}>{t.count}</p>
              <p className="text-xs text-text-secondary">sessions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
