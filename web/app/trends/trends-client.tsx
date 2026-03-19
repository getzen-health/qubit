'use client'

import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface Summary {
  date: string
  steps: number
  active_calories: number
  sleep_duration_minutes?: number
  avg_hrv?: number
  recovery_score?: number
  resting_heart_rate?: number
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// Compute Pearson correlation coefficient
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  const cov = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0) / n
  const sdX = Math.sqrt(xs.reduce((s, x) => s + (x - meanX) ** 2, 0) / n)
  const sdY = Math.sqrt(ys.reduce((s, y) => s + (y - meanY) ** 2, 0) / n)
  if (sdX === 0 || sdY === 0) return 0
  return cov / (sdX * sdY)
}

function correlationLabel(r: number): string {
  const abs = Math.abs(r)
  if (abs >= 0.7) return r > 0 ? 'Strong positive' : 'Strong negative'
  if (abs >= 0.4) return r > 0 ? 'Moderate positive' : 'Moderate negative'
  if (abs >= 0.2) return r > 0 ? 'Weak positive' : 'Weak negative'
  return 'No clear correlation'
}

interface Props {
  summaries: Summary[]
}

export function TrendsClient({ summaries }: Props) {
  if (summaries.length < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">📈</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Not enough data yet</h2>
        <p className="text-sm text-text-secondary">Sync at least 7 days of data to see trends.</p>
      </div>
    )
  }

  // Day-of-week step averages
  const dowData = DAYS.map((day, i) => {
    const days = summaries.filter((s) => new Date(s.date + 'T12:00:00').getDay() === i)
    const avg = days.length > 0 ? Math.round(days.reduce((a, b) => a + b.steps, 0) / days.length) : 0
    return { day, avg, count: days.length }
  })
  const maxDow = Math.max(...dowData.map((d) => d.avg))

  // Day-of-week sleep averages
  const dowSleep = DAYS.map((day, i) => {
    const days = summaries.filter(
      (s) => new Date(s.date + 'T12:00:00').getDay() === i && (s.sleep_duration_minutes ?? 0) > 0
    )
    const avg = days.length > 0 ? +(days.reduce((a, b) => a + (b.sleep_duration_minutes ?? 0), 0) / days.length / 60).toFixed(1) : 0
    return { day, avg, count: days.length }
  })
  const hasSleep = dowSleep.some((d) => d.avg > 0)

  // Sleep → next-day HRV scatter
  const sleepHrvPairs: { sleep: number; hrv: number }[] = []
  for (let i = 0; i < summaries.length - 1; i++) {
    const today = summaries[i + 1] // today is "next day" in ascending order
    const prev = summaries[i]      // previous night
    if ((prev.sleep_duration_minutes ?? 0) > 0 && (today.avg_hrv ?? 0) > 0) {
      sleepHrvPairs.push({
        sleep: +(prev.sleep_duration_minutes! / 60).toFixed(2),
        hrv: today.avg_hrv!,
      })
    }
  }
  const sleepHrvR = pearson(sleepHrvPairs.map((p) => p.sleep), sleepHrvPairs.map((p) => p.hrv))

  // Sleep → next-day recovery scatter
  const sleepRecoveryPairs: { sleep: number; recovery: number }[] = []
  for (let i = 0; i < summaries.length - 1; i++) {
    const today = summaries[i + 1]
    const prev = summaries[i]
    if ((prev.sleep_duration_minutes ?? 0) > 0 && (today.recovery_score ?? 0) > 0) {
      sleepRecoveryPairs.push({
        sleep: +(prev.sleep_duration_minutes! / 60).toFixed(2),
        recovery: today.recovery_score!,
      })
    }
  }
  const sleepRecoveryR = pearson(
    sleepRecoveryPairs.map((p) => p.sleep),
    sleepRecoveryPairs.map((p) => p.recovery)
  )

  // HRV → recovery scatter
  const hrvRecoveryPairs: { hrv: number; recovery: number }[] = summaries
    .filter((s) => (s.avg_hrv ?? 0) > 0 && (s.recovery_score ?? 0) > 0)
    .map((s) => ({ hrv: s.avg_hrv!, recovery: s.recovery_score! }))
  const hrvRecoveryR = pearson(
    hrvRecoveryPairs.map((p) => p.hrv),
    hrvRecoveryPairs.map((p) => p.recovery)
  )

  // Recovery consistency
  const recDays = summaries.filter((s) => (s.recovery_score ?? 0) > 0)
  const goodRecovery = recDays.filter((s) => s.recovery_score! >= 67).length
  const recConsistency = recDays.length > 0 ? Math.round((goodRecovery / recDays.length) * 100) : null

  // Weekend vs weekday steps
  const weekdayAvg = Math.round(
    summaries.filter((s) => { const d = new Date(s.date + 'T12:00:00').getDay(); return d >= 1 && d <= 5 })
      .reduce((a, b, _, arr) => a + b.steps / arr.length, 0)
  )
  const weekendAvg = Math.round(
    summaries.filter((s) => { const d = new Date(s.date + 'T12:00:00').getDay(); return d === 0 || d === 6 })
      .reduce((a, b, _, arr) => a + b.steps / arr.length, 0)
  )

  return (
    <div className="space-y-6">
      {/* Weekend vs Weekday */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Weekday vs Weekend Activity</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{weekdayAvg.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">avg weekday steps</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{weekendAvg.toLocaleString()}</p>
            <p className="text-xs text-text-secondary">avg weekend steps</p>
          </div>
        </div>
        {weekdayAvg > 0 && weekendAvg > 0 && (
          <p className="text-xs text-text-secondary text-center">
            {weekendAvg > weekdayAvg
              ? `You're ${Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100)}% more active on weekends`
              : `You're ${Math.round(((weekdayAvg - weekendAvg) / weekendAvg) * 100)}% more active on weekdays`}
          </p>
        )}
      </div>

      {/* Day-of-week steps */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Steps by Day of Week</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dowData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Avg steps']} />
            <Bar
              dataKey="avg"
              radius={[3, 3, 0, 0]}
              fill="#22c55e"
              label={false}
            />
            <ReferenceLine y={maxDow} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 3" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-secondary text-center mt-2">
          Most active: <span className="text-green-400 font-medium">{dowData.sort((a, b) => b.avg - a.avg)[0]?.day}</span>
          {' · '}
          Least active: <span className="text-text-secondary">{dowData.sort((a, b) => a.avg - b.avg)[0]?.day}</span>
        </p>
      </div>

      {/* Day-of-week sleep */}
      {hasSleep && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Sleep by Day of Week (hours)</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dowSleep} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}h`, 'Avg sleep']} />
              <Bar dataKey="avg" radius={[3, 3, 0, 0]} fill="#3b82f6" />
              <ReferenceLine y={8} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Correlation cards */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Metric Correlations</h2>
        <div className="space-y-3">
          {sleepHrvPairs.length >= 5 && (
            <CorrelationCard
              title="Sleep → Next-Day HRV"
              r={sleepHrvR}
              n={sleepHrvPairs.length}
              description="Does sleeping more lead to higher HRV the following morning?"
            />
          )}
          {sleepRecoveryPairs.length >= 5 && (
            <CorrelationCard
              title="Sleep → Next-Day Recovery"
              r={sleepRecoveryR}
              n={sleepRecoveryPairs.length}
              description="How much does last night's sleep predict today's recovery score?"
            />
          )}
          {hrvRecoveryPairs.length >= 5 && (
            <CorrelationCard
              title="HRV → Recovery Score"
              r={hrvRecoveryR}
              n={hrvRecoveryPairs.length}
              description="Relationship between morning HRV and daily recovery score."
            />
          )}
        </div>
      </div>

      {/* Recovery consistency */}
      {recConsistency !== null && recDays.length >= 7 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Recovery Consistency</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-surface-secondary" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={recConsistency >= 67 ? '#10b981' : recConsistency >= 40 ? '#eab308' : '#ef4444'}
                  strokeWidth="2.5"
                  strokeDasharray={`${recConsistency} ${100 - recConsistency}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary">
                {recConsistency}%
              </span>
            </div>
            <div>
              <p className="text-text-primary font-medium">
                {goodRecovery} of {recDays.length} days with good recovery (67%+)
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {recConsistency >= 67
                  ? 'Excellent consistency. You recover well most of the time.'
                  : recConsistency >= 40
                  ? 'Moderate consistency. Focus on sleep and stress management.'
                  : 'Low consistency. Review your sleep, nutrition, and training load.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Explore More */}
      <div>
        <h2 className="text-sm font-medium text-text-secondary mb-3 px-1">Explore More</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/score', emoji: '📊', label: 'Health Score', desc: 'Sleep · Activity · Recovery' },
            { href: '/year', emoji: '🎉', label: 'Year in Review', desc: '365-day highlights' },
            { href: '/compare', emoji: '↔️', label: 'Compare Weeks', desc: 'This week vs last' },
            { href: '/recovery', emoji: '⚡', label: 'Recovery', desc: 'HRV & strain scores' },
            { href: '/running', emoji: '🏃', label: 'Running', desc: 'Pace, distance & PRs' },
            { href: '/cycling', emoji: '🚴', label: 'Cycling', desc: 'Speed & weekly volume' },
            { href: '/swimming', emoji: '🏊', label: 'Swimming', desc: 'Pace per 100m' },
            { href: '/strength', emoji: '💪', label: 'Strength', desc: 'Sessions & volume' },
            { href: '/zones', emoji: '❤️', label: 'HR Zones', desc: 'Training zone breakdown' },
            { href: '/vo2max', emoji: '🫁', label: 'Cardio Fitness', desc: 'VO₂ max trend' },
            { href: '/hrv', emoji: '〰️', label: 'HRV Analysis', desc: 'Baseline & patterns' },
            { href: '/training-load', emoji: '📈', label: 'Training Load', desc: 'ACWR & fatigue' },
          ].map(({ href, emoji, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-surface border border-border rounded-xl p-3 flex items-start gap-3 hover:border-accent/50 transition-colors"
            >
              <span className="text-2xl leading-none mt-0.5">{emoji}</span>
              <div className="min-w-0">
                <p className="font-medium text-text-primary text-sm leading-tight">{label}</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-tight">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function CorrelationCard({ title, r, n, description }: { title: string; r: number; n: number; description: string }) {
  const absR = Math.abs(r)
  const barColor = absR >= 0.4 ? (r > 0 ? '#10b981' : '#ef4444') : '#6b7280'
  const label = correlationLabel(r)

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-text-primary">r = {r.toFixed(2)}</p>
          <p className="text-xs text-text-secondary">{n} data points</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${absR * 100}%`, backgroundColor: barColor }}
          />
        </div>
        <span className="text-xs font-medium shrink-0" style={{ color: barColor }}>{label}</span>
      </div>
    </div>
  )
}
