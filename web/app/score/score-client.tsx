'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DaySummary {
  date: string
  steps?: number | null
  active_calories?: number | null
  sleep_duration_minutes?: number | null
  resting_heart_rate?: number | null
  avg_hrv?: number | null
  recovery_score?: number | null
}

interface WorkoutRecord {
  start_time: string
  duration_minutes: number
}

interface HealthScoreClientProps {
  summaries: DaySummary[]
  workouts: WorkoutRecord[]
  stepGoal: number
  calorieGoal: number
  sleepGoalMinutes: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v))
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreColor(score: number): string {
  if (score >= 80) return '#4ade80'
  if (score >= 65) return '#a3e635'
  if (score >= 50) return '#facc15'
  if (score >= 35) return '#fb923c'
  return '#f87171'
}

function scoreGrade(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 40) return 'Low'
  return 'Poor'
}

// Score each category for a single day
function scoreSleepDay(day: DaySummary, sleepGoalMinutes: number): number | null {
  if (!day.sleep_duration_minutes || day.sleep_duration_minutes < 60) return null
  const pct = day.sleep_duration_minutes / sleepGoalMinutes
  // Full points at goal, diminishing above, penalty below
  if (pct >= 1.0) return clamp(100 - (pct - 1) * 50)  // slight penalty for over-sleeping
  return clamp(pct * 100 * 0.9) // scale to 90% max if under goal (leave room for quality)
}

function scoreActivityDay(day: DaySummary, stepGoal: number, calorieGoal: number): number | null {
  const hasSteps = day.steps && day.steps > 0
  const hasCal = day.active_calories && day.active_calories > 0
  if (!hasSteps && !hasCal) return null
  const stepScore = hasSteps ? clamp((day.steps! / stepGoal) * 100) : 0
  const calScore = hasCal && calorieGoal > 0 ? clamp((day.active_calories! / calorieGoal) * 100) : 0
  if (hasSteps && hasCal) return (stepScore + calScore) / 2
  return hasSteps ? stepScore : calScore
}

function scoreRecoveryDay(day: DaySummary, baselineHrv: number, baselineRhr: number): number | null {
  const hasHrv = day.avg_hrv && day.avg_hrv > 0
  const hasRhr = day.resting_heart_rate && day.resting_heart_rate > 0
  if (!hasHrv && !hasRhr) return day.recovery_score ?? null
  let score = 50
  if (hasHrv && baselineHrv > 0) {
    // HRV above baseline = better recovery. 10% above baseline = +15 pts
    const ratio = day.avg_hrv! / baselineHrv
    score += clamp((ratio - 0.7) / 0.6 * 50, -25, 50)
  }
  if (hasRhr && baselineRhr > 0) {
    // Lower resting HR = better recovery. 5 BPM below baseline = +10 pts
    const diff = baselineRhr - day.resting_heart_rate!
    score += clamp(diff * 2, -20, 20)
  }
  // Blend with explicit recovery_score if available
  if (day.recovery_score && day.recovery_score > 0) {
    return clamp((score + day.recovery_score) / 2)
  }
  return clamp(score)
}

function scoreConsistencyWeek(weekDays: DaySummary[]): number {
  // How many days have meaningful data (steps or sleep)
  const activeDays = weekDays.filter((d) => (d.steps && d.steps > 500) || (d.sleep_duration_minutes && d.sleep_duration_minutes > 120)).length
  return clamp((activeDays / 7) * 100)
}

// ScoreRing SVG component
function ScoreRing({ score, size = 120, stroke = 10 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = scoreColor(score)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

export function HealthScoreClient({
  summaries, workouts, stepGoal, calorieGoal, sleepGoalMinutes,
}: HealthScoreClientProps) {
  if (summaries.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📊</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          At least 3 days of synced data required. Sync your iPhone to get your health score.
        </p>
      </div>
    )
  }

  // Baseline values (median from available data)
  const hrvValues = summaries.map((d) => d.avg_hrv ?? 0).filter((v) => v > 0).sort((a, b) => a - b)
  const rhrValues = summaries.map((d) => d.resting_heart_rate ?? 0).filter((v) => v > 0).sort((a, b) => a - b)
  const baselineHrv = hrvValues.length > 0 ? hrvValues[Math.floor(hrvValues.length / 2)] : 0
  const baselineRhr = rhrValues.length > 0 ? rhrValues[Math.floor(rhrValues.length / 2)] : 0

  // Workout days set
  const workoutDays = new Set(workouts.map((w) => w.start_time.slice(0, 10)))

  // Score each day
  const scored = summaries.map((day) => {
    const sleep = scoreSleepDay(day, sleepGoalMinutes)
    const activity = scoreActivityDay(day, stepGoal, calorieGoal)
    const recovery = scoreRecoveryDay(day, baselineHrv, baselineRhr)
    const hasWorkout = workoutDays.has(day.date) ? 1 : 0

    const components = [sleep, activity, recovery].filter((v): v is number => v !== null)
    const overall = components.length > 0 ? Math.round(components.reduce((a, b) => a + b, 0) / components.length) : null

    return { date: day.date, sleep, activity, recovery, hasWorkout, overall }
  })

  // Last 7 days for current score
  const last7 = scored.slice(-7)
  const prev7 = scored.slice(-14, -7)

  function avgScore(days: typeof scored, key: 'sleep' | 'activity' | 'recovery' | 'overall'): number | null {
    const vals = days.map((d) => d[key]).filter((v): v is number => v !== null)
    if (!vals.length) return null
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  const currentOverall = avgScore(last7, 'overall')
  const prevOverall = avgScore(prev7, 'overall')
  const currentSleep = avgScore(last7, 'sleep')
  const currentActivity = avgScore(last7, 'activity')
  const currentRecovery = avgScore(last7, 'recovery')
  const consistencyScore = Math.round(scoreConsistencyWeek(last7.map((d) => summaries.find((s) => s.date === d.date)!).filter(Boolean)))
  const prevConsistency = prev7.length > 0 ? Math.round(scoreConsistencyWeek(prev7.map((d) => summaries.find((s) => s.date === d.date)!).filter(Boolean))) : null

  // Trend direction
  function trend(current: number | null, prev: number | null): string {
    if (current === null || prev === null) return ''
    const diff = current - prev
    if (diff >= 5) return '↑'
    if (diff <= -5) return '↓'
    return '→'
  }

  // 30-day chart data — include raw recovery_score from the database for comparison
  const chartData = scored
    .filter((d) => d.overall !== null)
    .map((d) => {
      const summary = summaries.find((s) => s.date === d.date)
      return {
        date: fmtDate(d.date),
        score: d.overall!,
        sleep: d.sleep,
        activity: d.activity,
        recovery: d.recovery,
        rawRecovery: (summary?.recovery_score != null && summary.recovery_score > 0) ? summary.recovery_score : null,
      }
    })

  const overallScore = currentOverall ?? 0

  return (
    <div className="space-y-6">
      {/* Main score */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <ScoreRing score={overallScore} size={140} stroke={12} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black" style={{ color: scoreColor(overallScore) }}>{overallScore}</p>
              <p className="text-xs text-text-secondary -mt-1">/ 100</p>
            </div>
          </div>
          <div className="flex-1 pl-6">
            <p className="text-2xl font-bold" style={{ color: scoreColor(overallScore) }}>{scoreGrade(overallScore)}</p>
            <p className="text-sm text-text-secondary mt-1">7-day average</p>
            {prevOverall !== null && currentOverall !== null && (
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-sm font-medium ${currentOverall > prevOverall ? 'text-green-400' : currentOverall < prevOverall ? 'text-red-400' : 'text-text-secondary'}`}>
                  {trend(currentOverall, prevOverall)} {currentOverall > prevOverall ? '+' : ''}{currentOverall - prevOverall} vs prev week
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Component scores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sleep', score: currentSleep, prev: avgScore(prev7, 'sleep'), icon: '🌙' },
          { label: 'Activity', score: currentActivity, prev: avgScore(prev7, 'activity'), icon: '⚡' },
          { label: 'Recovery', score: currentRecovery, prev: avgScore(prev7, 'recovery'), icon: '💚' },
          { label: 'Consistency', score: consistencyScore, prev: prevConsistency, icon: '🎯' },
        ].map(({ label, score, prev, icon }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <span className="text-xl">{icon}</span>
            <div className="relative mt-2 mb-1">
              <svg width={60} height={60} viewBox="0 0 60 60" className="-rotate-90 mx-auto">
                <circle cx={30} cy={30} r={22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
                {score !== null && (
                  <circle cx={30} cy={30} r={22} fill="none"
                    stroke={scoreColor(score)} strokeWidth={6}
                    strokeDasharray={`${(score / 100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                    strokeLinecap="round" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm font-bold" style={{ color: score !== null ? scoreColor(score) : 'var(--color-text-secondary)' }}>
                  {score ?? '—'}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">{label}</p>
            {score !== null && prev !== null && (
              <p className={`text-xs mt-0.5 ${score > prev ? 'text-green-400' : score < prev ? 'text-red-400' : 'text-text-secondary'}`}>
                {trend(score, prev)} {score > prev ? '+' : ''}{score - prev}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 30-day trend chart */}
      {chartData.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">30-Day Score History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[0, 100]} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [Math.round(v), name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Line type="monotone" dataKey="score" name="overall" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="sleep" name="sleep" stroke="#818cf8" strokeWidth={1} dot={false} strokeDasharray="3 2" />
              <Line type="monotone" dataKey="activity" name="activity" stroke="#4ade80" strokeWidth={1} dot={false} strokeDasharray="3 2" />
              <Line type="monotone" dataKey="recovery" name="recovery" stroke="#fb923c" strokeWidth={1} dot={false} strokeDasharray="3 2" />
              <Line type="monotone" dataKey="rawRecovery" name="raw recovery" stroke="#f59e0b" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-secondary">
            {[
              { color: '#60a5fa', label: 'Overall' },
              { color: '#818cf8', label: 'Sleep' },
              { color: '#4ade80', label: 'Activity' },
              { color: '#fb923c', label: 'Recovery' },
              { color: '#f59e0b', label: 'Raw Recovery' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">How your score is calculated</p>
        <div className="space-y-2">
          {[
            { icon: '🌙', name: 'Sleep', weight: '33%', detail: 'Duration relative to your sleep goal. Consistently meeting your goal scores 100. Short sleep below 70% of goal penalizes heavily.' },
            { icon: '⚡', name: 'Activity', weight: '33%', detail: 'Blend of daily steps vs step goal and active calories vs calorie goal. Capped at 100 (extra steps don\'t add more points).' },
            { icon: '💚', name: 'Recovery', weight: '33%', detail: 'HRV compared to your 30-day baseline and resting heart rate trend. Higher HRV and lower resting HR than baseline scores higher.' },
            { icon: '🎯', name: 'Consistency', weight: 'bonus', detail: 'Shown separately. % of days in the past 7 with meaningful activity or sleep data. Not averaged into the main score.' },
          ].map(({ icon, name, weight, detail }) => (
            <div key={name} className="flex gap-2">
              <span className="text-base">{icon}</span>
              <div>
                <p className="font-medium text-text-primary">{name} <span className="text-text-secondary font-normal">({weight})</span></p>
                <p className="opacity-70 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">Score is computed locally from your synced data. It improves in accuracy as more days of data are available.</p>
      </div>
    </div>
  )
}
