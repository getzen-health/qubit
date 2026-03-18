'use client'

import Link from 'next/link'

interface DailySummary {
  date: string
  avg_hrv: number | null
  resting_heart_rate: number | null
  sleep_duration_minutes: number | null
  active_calories: number | null
  recovery_score: number | null
  steps: number | null
}

interface Workout {
  start_time: string
  workout_type: string
  duration_minutes: number
  active_calories: number | null
}

interface SleepRecord {
  end_time: string
  duration_minutes: number
}

interface ReadyClientProps {
  summaries: DailySummary[]
  recentWorkouts: Workout[]
  sleepRecords: SleepRecord[]
  sleepGoalMinutes: number
}

// Compute ATL (7-day EWA) and CTL (42-day EWA) for TSB
const K_ATL = 1 - Math.exp(-1 / 7)
const K_CTL = 1 - Math.exp(-1 / 42)

function tssProxy(cal: number | null, durMin: number): number {
  if (cal && cal > 0) return Math.min(300, cal / 5)
  return Math.min(150, (durMin / 60) * 50)
}

interface Factor {
  label: string
  value: string
  status: 'positive' | 'neutral' | 'negative'
  note: string
  href?: string
}

interface Recommendation {
  intensity: string
  label: string
  color: string
  emoji: string
  description: string
  suggestions: string[]
}

export function ReadyClient({
  summaries,
  recentWorkouts,
  sleepRecords,
  sleepGoalMinutes,
}: ReadyClientProps) {
  if (summaries.length === 0 && recentWorkouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📊</span>
        <h2 className="text-lg font-semibold text-text-primary">Not enough data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync a few weeks of Apple Health data to get personalized readiness recommendations.
        </p>
      </div>
    )
  }

  // --- HRV analysis ---
  const hrvValues = summaries
    .filter((s) => s.avg_hrv && s.avg_hrv > 0)
    .map((s) => s.avg_hrv!)
  const hrvMean = hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : null
  const hrvStd =
    hrvMean && hrvValues.length > 2
      ? Math.sqrt(hrvValues.reduce((s, v) => s + Math.pow(v - hrvMean, 2), 0) / hrvValues.length)
      : null
  const todayHrv = summaries[summaries.length - 1]?.avg_hrv ?? null

  // --- TSB (Training Stress Balance) ---
  const dateMap = new Map<string, number>()
  for (const w of recentWorkouts) {
    const date = w.start_time.slice(0, 10)
    const tss = tssProxy(w.active_calories, w.duration_minutes)
    dateMap.set(date, (dateMap.get(date) ?? 0) + tss)
  }

  // Build 90-day daily TSS array
  let atl = 0
  let ctl = 0
  for (let i = 89; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const tss = dateMap.get(dateStr) ?? 0
    atl = atl + K_ATL * (tss - atl)
    ctl = ctl + K_CTL * (tss - ctl)
  }
  const tsb = ctl - atl

  // --- Sleep debt ---
  // Get the most recent sleep record (grouped by night)
  const sleepByNight = new Map<string, number>()
  for (const r of sleepRecords) {
    const night = r.end_time.slice(0, 10)
    sleepByNight.set(night, Math.max(sleepByNight.get(night) ?? 0, r.duration_minutes))
  }
  const lastNightSleep =
    Array.from(sleepByNight.entries())
      .sort(([a], [b]) => b.localeCompare(a))[0]?.[1] ?? null

  // 7-day sleep average
  const recent7Sleep = Array.from(sleepByNight.values()).slice(-7)
  const avg7Sleep = recent7Sleep.length > 0 ? recent7Sleep.reduce((a, b) => a + b, 0) / recent7Sleep.length : null

  // --- Consecutive workout days (rest detection) ---
  const workoutDates = new Set(recentWorkouts.map((w) => w.start_time.slice(0, 10)))
  let consecutiveDays = 0
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    if (i === 0) continue // skip today
    if (workoutDates.has(dateStr)) consecutiveDays++
    else break
  }

  // --- Build factors list ---
  const factors: Factor[] = []

  // HRV factor
  if (todayHrv !== null && hrvMean !== null) {
    const deviations = hrvStd ? (todayHrv - hrvMean) / hrvStd : 0
    if (deviations > 0.5) {
      factors.push({
        label: 'HRV',
        value: `${Math.round(todayHrv)} ms`,
        status: 'positive',
        note: `${Math.round(deviations * 10) / 10}σ above your baseline — nervous system well recovered`,
        href: '/hrv',
      })
    } else if (deviations > -0.5) {
      factors.push({
        label: 'HRV',
        value: `${Math.round(todayHrv)} ms`,
        status: 'neutral',
        note: `Within your normal range (${Math.round(hrvMean)} ± ${Math.round(hrvStd ?? 0)} ms)`,
        href: '/hrv',
      })
    } else {
      factors.push({
        label: 'HRV',
        value: `${Math.round(todayHrv)} ms`,
        status: 'negative',
        note: `${Math.round(Math.abs(deviations) * 10) / 10}σ below baseline — consider lighter activity`,
        href: '/hrv',
      })
    }
  }

  // Sleep factor
  if (lastNightSleep !== null) {
    const sleepH = lastNightSleep / 60
    const deficit = sleepGoalMinutes - lastNightSleep
    if (lastNightSleep >= sleepGoalMinutes) {
      factors.push({
        label: 'Sleep',
        value: `${Math.floor(sleepH)}h ${Math.round((sleepH % 1) * 60)}m`,
        status: 'positive',
        note: 'Met your sleep goal — well rested',
        href: '/sleep',
      })
    } else if (deficit < 60) {
      factors.push({
        label: 'Sleep',
        value: `${Math.floor(sleepH)}h ${Math.round((sleepH % 1) * 60)}m`,
        status: 'neutral',
        note: `${Math.round(deficit)}m short of goal — minor sleep deficit`,
        href: '/sleep',
      })
    } else {
      factors.push({
        label: 'Sleep',
        value: `${Math.floor(sleepH)}h ${Math.round((sleepH % 1) * 60)}m`,
        status: 'negative',
        note: `${Math.floor(deficit / 60)}h ${Math.round(deficit % 60)}m short of goal — prioritize recovery`,
        href: '/sleep/debt',
      })
    }
  }

  // TSB / Training Load factor
  if (Math.abs(tsb) > 2 || ctl > 5) {
    if (tsb > 15) {
      factors.push({
        label: 'Training Load',
        value: `TSB +${Math.round(tsb)}`,
        status: 'positive',
        note: 'Fresh — training load tapered, ready for intensity',
        href: '/training-load',
      })
    } else if (tsb > -10) {
      factors.push({
        label: 'Training Load',
        value: `TSB ${Math.round(tsb)}`,
        status: 'neutral',
        note: 'Productive zone — balanced training stress',
        href: '/training-load',
      })
    } else if (tsb > -25) {
      factors.push({
        label: 'Training Load',
        value: `TSB ${Math.round(tsb)}`,
        status: 'negative',
        note: 'Fatigued — training stress high, active recovery advised',
        href: '/training-load',
      })
    } else {
      factors.push({
        label: 'Training Load',
        value: `TSB ${Math.round(tsb)}`,
        status: 'negative',
        note: 'Overreaching — full rest recommended',
        href: '/training-load',
      })
    }
  }

  // Consecutive days factor
  if (consecutiveDays >= 5) {
    factors.push({
      label: 'Rest Days',
      value: `${consecutiveDays} straight`,
      status: 'negative',
      note: `${consecutiveDays} consecutive workout days — a rest or active recovery day is overdue`,
    })
  } else if (consecutiveDays >= 3) {
    factors.push({
      label: 'Rest Days',
      value: `${consecutiveDays} days`,
      status: 'neutral',
      note: 'Building momentum — plan a rest day within 1-2 days',
    })
  }

  // 7-day sleep average
  if (avg7Sleep !== null) {
    const avg7H = avg7Sleep / 60
    if (avg7Sleep < sleepGoalMinutes * 0.85) {
      factors.push({
        label: '7-Day Sleep Avg',
        value: `${Math.floor(avg7H)}h ${Math.round((avg7H % 1) * 60)}m`,
        status: 'negative',
        note: 'Chronic sleep deficit — recovery is impaired',
        href: '/sleep/debt',
      })
    }
  }

  // --- Compute overall readiness score (0-100) ---
  let score = 65 // baseline
  let scoreFactors = 0

  if (todayHrv !== null && hrvMean !== null && hrvStd !== null) {
    const deviations = (todayHrv - hrvMean) / Math.max(hrvStd, 1)
    score += deviations * 12
    scoreFactors++
  }
  if (lastNightSleep !== null) {
    const sleepRatio = lastNightSleep / sleepGoalMinutes
    score += (sleepRatio - 1) * 20
    scoreFactors++
  }
  if (Math.abs(tsb) > 2 || ctl > 5) {
    if (tsb > 15) score += 10
    else if (tsb > 0) score += 4
    else if (tsb > -15) score -= 5
    else score -= 15
    scoreFactors++
  }
  if (consecutiveDays >= 5) score -= 10
  if (consecutiveDays >= 3) score -= 4

  score = Math.max(10, Math.min(100, Math.round(score)))

  // --- Recommendation ---
  let rec: Recommendation
  if (score >= 80) {
    rec = {
      intensity: 'Hard',
      label: 'Push day',
      color: '#22c55e',
      emoji: '🟢',
      description: "Your body is primed for performance. Today is ideal for high-intensity work, long runs, heavy lifts, or race-pace efforts.",
      suggestions: ['Tempo run or intervals', 'Heavy compound lifts', 'HIIT or CrossFit', 'Long ride at threshold'],
    }
  } else if (score >= 60) {
    rec = {
      intensity: 'Moderate',
      label: 'Train day',
      color: '#38bdf8',
      emoji: '🔵',
      description: "You're in good shape. A solid workout is appropriate — push at a moderate, sustainable pace.",
      suggestions: ['Steady-state cardio', 'Moderate strength session', 'Group fitness class', 'Hike or long walk'],
    }
  } else if (score >= 40) {
    rec = {
      intensity: 'Light',
      label: 'Easy day',
      color: '#f97316',
      emoji: '🟡',
      description: "Your metrics suggest some fatigue. Keep intensity low — movement is good, but avoid pushing hard.",
      suggestions: ['Yoga or stretching', 'Easy walk or swim', 'Mobility work', '20-30 min zone 1 cardio'],
    }
  } else {
    rec = {
      intensity: 'Rest',
      label: 'Rest day',
      color: '#ef4444',
      emoji: '🔴',
      description: "Your body needs recovery today. Prioritize sleep, nutrition, and light movement only.",
      suggestions: ['Full rest', 'Gentle stretching', 'Meditation or breathwork', 'Extra sleep tonight'],
    }
  }

  const statusColor = score >= 80 ? '#22c55e' : score >= 60 ? '#38bdf8' : score >= 40 ? '#f97316' : '#ef4444'
  const statusLabel = score >= 80 ? 'High' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Low'

  const positiveCount = factors.filter((f) => f.status === 'positive').length
  const negativeCount = factors.filter((f) => f.status === 'negative').length

  return (
    <div className="space-y-6">
      {/* Readiness score ring */}
      <div className="bg-surface rounded-xl border border-border p-6 flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width={100} height={100} className="-rotate-90">
            <circle cx={50} cy={50} r={44} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
            <circle
              cx={50}
              cy={50}
              r={44}
              fill="none"
              stroke={statusColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - score / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color: statusColor }}>
              {score}
            </span>
            <span className="text-[10px] text-text-secondary font-medium">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-text-secondary mb-0.5">Readiness</p>
          <p className="text-2xl font-bold" style={{ color: statusColor }}>
            {rec.emoji} {statusLabel}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {positiveCount > 0 && `${positiveCount} positive signal${positiveCount > 1 ? 's' : ''}`}
            {positiveCount > 0 && negativeCount > 0 && ' · '}
            {negativeCount > 0 && `${negativeCount} concern${negativeCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Today's recommendation */}
      <div
        className="rounded-xl border p-5 space-y-3"
        style={{
          background: `${rec.color}10`,
          borderColor: `${rec.color}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{rec.emoji}</span>
          <div>
            <p className="font-semibold text-text-primary text-lg">{rec.label}</p>
            <p className="text-xs text-text-secondary">{rec.intensity} intensity recommended</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{rec.description}</p>
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2">Ideas for today</p>
          <div className="grid grid-cols-2 gap-1.5">
            {rec.suggestions.map((s) => (
              <div
                key={s}
                className="text-xs text-text-secondary px-2.5 py-1.5 rounded-lg border"
                style={{ borderColor: `${rec.color}25`, background: `${rec.color}08` }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Factors breakdown */}
      {factors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Contributing Factors
          </h3>
          {factors.map((f) => (
            <div
              key={f.label}
              className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background:
                    f.status === 'positive'
                      ? '#22c55e'
                      : f.status === 'neutral'
                      ? '#38bdf8'
                      : '#ef4444',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">{f.label}</p>
                  <p
                    className="text-sm font-mono font-bold shrink-0"
                    style={{
                      color:
                        f.status === 'positive'
                          ? '#22c55e'
                          : f.status === 'neutral'
                          ? '#38bdf8'
                          : '#ef4444',
                    }}
                  >
                    {f.value}
                  </p>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">{f.note}</p>
              </div>
              {f.href && (
                <Link
                  href={f.href}
                  className="text-xs text-accent hover:underline shrink-0"
                >
                  Details →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'HRV Analysis', href: '/hrv', emoji: '💗' },
          { label: 'Training Load', href: '/training-load', emoji: '📈' },
          { label: 'Sleep Debt', href: '/sleep/debt', emoji: '💤' },
          { label: 'Recovery', href: '/recovery', emoji: '⚡' },
        ].map(({ label, href, emoji }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-3 py-2.5 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors text-sm text-text-secondary"
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Methodology note */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-1.5">
        <p className="font-medium text-text-primary text-sm">How it&apos;s calculated</p>
        <p>
          Readiness combines HRV relative to your personal baseline (±σ), last night&apos;s sleep vs your
          goal, and Training Stress Balance (CTL − ATL from the Banister model). Each signal is
          weighted by how much data is available.
        </p>
        <p className="opacity-60">
          This is a guide, not a rigid rule. If you feel strong and the score says easy day, trust your
          body — and vice versa.
        </p>
      </div>
    </div>
  )
}
