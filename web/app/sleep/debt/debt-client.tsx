'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

interface SleepRecord {
  start_time: string
  end_time: string
  duration_minutes: number
}

interface DebtClientProps {
  records: SleepRecord[]
  goalMinutes: number
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtMins(min: number): string {
  const sign = min < 0 ? '-' : ''
  const abs = Math.abs(min)
  const h = Math.floor(abs / 60)
  const m = Math.round(abs % 60)
  if (h === 0) return `${sign}${m}m`
  if (m === 0) return `${sign}${h}h`
  return `${sign}${h}h ${m}m`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function DebtClient({ records, goalMinutes }: DebtClientProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">😴</span>
        <h2 className="text-lg font-semibold text-text-primary">No sleep data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sleep data syncs from Apple Health via the KQuarks iOS app.
        </p>
      </div>
    )
  }

  // Consolidate to one record per night — use end_time date as the night key
  // (morning wake-up date = the sleep "night")
  const durationByNight = new Map<string, number>()
  for (const r of records) {
    const night = r.end_time ? r.end_time.slice(0, 10) : r.start_time.slice(0, 10)
    const existing = durationByNight.get(night) ?? 0
    // Sum durations on same night (covers split sleep sessions)
    durationByNight.set(night, existing + r.duration_minutes)
  }

  const sortedNights = Array.from(durationByNight.keys()).sort()

  // Build daily data with running cumulative debt
  let runningDebtMin = 0
  const dailyData = sortedNights.map((night) => {
    const sleptMin = durationByNight.get(night)!
    const nightDebtMin = goalMinutes - sleptMin // positive = deficit
    runningDebtMin += nightDebtMin
    return {
      night,
      date: fmtDate(night),
      sleptHours: Math.round((sleptMin / 60) * 10) / 10,
      goalHours: goalMinutes / 60,
      debtMin: nightDebtMin,
      runningDebtHours: Math.round((runningDebtMin / 60) * 10) / 10,
    }
  })

  // Summary stats
  const last14 = dailyData.slice(-14)
  const debtNights14 = last14.filter((d) => d.debtMin > 0)
  const totalDebt14Min = last14.reduce((s, d) => s + d.debtMin, 0)
  const avgDeficitMin =
    debtNights14.length > 0
      ? debtNights14.reduce((s, d) => s + d.debtMin, 0) / debtNights14.length
      : 0

  const currentRunningDebtHours = dailyData[dailyData.length - 1]?.runningDebtHours ?? 0
  // Repayment estimate: assume 30 extra minutes sleep per night possible
  const nightsToRepay =
    currentRunningDebtHours > 0 ? Math.ceil((currentRunningDebtHours * 60) / 30) : 0

  const goalHours = goalMinutes / 60

  // Weekly totals
  const weekMap = new Map<string, { totalMin: number; nights: number }>()
  for (const d of dailyData) {
    const week = getMonday(d.night)
    const existing = weekMap.get(week) ?? { totalMin: 0, nights: 0 }
    existing.totalMin += durationByNight.get(d.night)!
    existing.nights++
    weekMap.set(week, existing)
  }
  const weeklyData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { totalMin, nights }]) => ({
      week: fmtDate(week),
      totalHours: Math.round((totalMin / 60) * 10) / 10,
      goalHours: Math.round(((goalMinutes / 60) * nights) * 10) / 10,
      deficitHours: Math.max(0, Math.round(((goalMinutes * nights - totalMin) / 60) * 10) / 10),
    }))

  const debtColor =
    currentRunningDebtHours > 8
      ? '#ef4444'
      : currentRunningDebtHours > 2
      ? '#f97316'
      : '#22c55e'

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Running Debt',
            value:
              currentRunningDebtHours > 0
                ? fmtMins(Math.round(currentRunningDebtHours * 60))
                : 'In surplus',
            sub: '90-day cumulative',
            color: debtColor,
          },
          {
            label: 'Last 14 Nights',
            value: totalDebt14Min > 0 ? fmtMins(Math.round(totalDebt14Min)) : 'Surplus',
            sub: `${debtNights14.length}/${last14.length} nights short`,
            color: totalDebt14Min > 120 ? '#ef4444' : totalDebt14Min > 0 ? '#f97316' : '#22c55e',
          },
          {
            label: 'Avg Deficit',
            value: avgDeficitMin > 0 ? fmtMins(Math.round(avgDeficitMin)) : '—',
            sub: 'per short night',
            color: 'var(--color-text-primary)',
          },
          {
            label: 'Repay In',
            value: nightsToRepay > 0 ? `~${nightsToRepay} nights` : 'Balanced',
            sub: 'at +30min/night',
            color: 'var(--color-text-primary)',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-black" style={{ color }}>
              {value}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{sub}</p>
            <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Cumulative debt area chart */}
      {dailyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Cumulative Sleep Debt</h3>
          <p className="text-xs text-text-secondary mb-3">
            Rising = accumulating debt · Falling = recovering · Below 0 = surplus
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={34}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [
                  `${v > 0 ? '+' : ''}${v}h`,
                  v > 0 ? 'Sleep debt' : 'Sleep surplus',
                ]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Area
                type="monotone"
                dataKey="runningDebtHours"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#debtGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Nightly sleep vs goal */}
      {dailyData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Nightly Sleep vs Goal</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}h`, 'Slept']}
              />
              <ReferenceLine
                y={goalHours}
                stroke="rgba(99,102,241,0.5)"
                strokeDasharray="4 2"
                label={{
                  value: `Goal ${goalHours}h`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'rgba(99,102,241,0.8)',
                }}
              />
              <Bar dataKey="sleptHours" radius={[2, 2, 0, 0]}>
                {dailyData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.sleptHours >= goalHours ? '#22c55e' : d.sleptHours >= goalHours * 0.85 ? '#f97316' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>Met goal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-orange-400" />
              <span>&gt; 85% of goal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span>Short night</span>
            </div>
          </div>
        </div>
      )}

      {/* Weekly totals */}
      {weeklyData.length >= 2 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Weekly Total Sleep</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  `${v}h`,
                  name === 'totalHours' ? 'Total sleep' : 'Weekly goal',
                ]}
              />
              <ReferenceLine
                y={goalHours * 7}
                stroke="rgba(99,102,241,0.4)"
                strokeDasharray="4 2"
                label={{
                  value: `${Math.round(goalHours * 7 * 10) / 10}h goal`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'rgba(99,102,241,0.7)',
                }}
              />
              <Bar dataKey="totalHours" radius={[3, 3, 0, 0]}>
                {weeklyData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.totalHours >= goalHours * 7 * 0.9 ? '#6366f1' : '#f97316'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Worst & best weeks */}
      {weeklyData.length >= 4 && (() => {
        const withDeficit = weeklyData.filter((w) => w.goalHours > 0)
        const worst = [...withDeficit].sort((a, b) => b.deficitHours - a.deficitHours)[0]
        const best = [...withDeficit].sort((a, b) => a.deficitHours - b.deficitHours)[0]
        if (!worst || !best) return null
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-text-secondary mb-1">Worst Week</p>
              <p className="text-lg font-bold text-red-400">{worst.week}</p>
              <p className="text-sm text-text-secondary mt-0.5">
                {worst.deficitHours}h short of goal
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-text-secondary mb-1">Best Week</p>
              <p className="text-lg font-bold text-green-400">{best.week}</p>
              <p className="text-sm text-text-secondary mt-0.5">
                {best.deficitHours === 0
                  ? `${best.totalHours}h total`
                  : `${best.deficitHours}h short`}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Context */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-2">
        <p className="font-medium text-text-primary text-sm">About Sleep Debt</p>
        <p>
          Sleep debt is the cumulative difference between the sleep you need and what you get. It
          compounds over time, impairing cognition, mood, immune function, and metabolism.
        </p>
        <div className="space-y-1.5 pt-1">
          {[
            {
              label: 'Short-term debt',
              desc: 'Can be partially recovered with 1–2 good nights',
            },
            {
              label: 'Chronic debt (2+ weeks)',
              desc: 'Requires consistent good sleep over 2–4 weeks to recover',
            },
            {
              label: 'Full recovery',
              desc: 'May take several weeks — sleep quality matters as much as quantity',
            },
          ].map(({ label, desc }) => (
            <div key={label}>
              <span className="font-medium text-text-primary">{label}: </span>
              <span className="opacity-70">{desc}</span>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1">
          Based on your goal of {goalHours}h/night. Actual need varies by individual — adjust
          your goal in Settings → Goals.
        </p>
      </div>
    </div>
  )
}
