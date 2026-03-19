'use client'

import { useState } from 'react'

interface HRVDay {
  date: string
  hrv: number
  baseline: number
  deviation: number
  level: number  // -2 to +2
}

interface Props {
  days: HRVDay[]
  avgHrv: number | null
  latestBaseline: number | null
  recoveredDays: number
  stressedDays: number
}

// Color per level: -2=red, -1=orange, 0=gray, +1=light green, +2=dark green
const LEVEL_COLORS: Record<number, string> = {
  2:  '#22c55e',   // strong recovery
  1:  '#86efac',   // mild recovery
  0:  '#374151',   // baseline (neutral)
  '-1': '#fb923c', // mild stress
  '-2': '#ef4444', // high stress
}

const LEVEL_LABELS: Record<number, string> = {
  2: 'Well above baseline',
  1: 'Slightly above baseline',
  0: 'Near baseline',
  '-1': 'Slightly below baseline',
  '-2': 'Well below baseline',
}

function cellColor(level: number): string {
  return LEVEL_COLORS[level] ?? LEVEL_COLORS[0]
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

// Build 365-day grid (same as activity heatmap)
function buildGrid(days: HRVDay[]): Array<Array<HRVDay | null>> {
  const dayMap = new Map(days.map(d => [d.date, d]))
  const today = new Date()
  const startDate = new Date(today)
  startDate.setFullYear(today.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1)

  // Pad to start on Sunday
  const startDow = startDate.getDay()
  const paddedStart = new Date(startDate)
  paddedStart.setDate(paddedStart.getDate() - startDow)

  const weeks: Array<Array<HRVDay | null>> = []
  let week: Array<HRVDay | null> = []
  const cur = new Date(paddedStart)

  while (cur <= today || week.length > 0) {
    const dateStr = cur.toISOString().slice(0, 10)
    const isBefore = cur < startDate
    const isAfter = cur > today
    week.push(isBefore || isAfter ? null : (dayMap.get(dateStr) ?? null))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
    cur.setDate(cur.getDate() + 1)
    if (cur > today && week.length === 0) break
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

// Month labels: figure out which week each month starts in
function getMonthLabels(weeks: Array<Array<HRVDay | null>>): Array<{ week: number; label: string }> {
  const labels: Array<{ week: number; label: string }> = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstDay = week.find(d => d !== null)
    if (!firstDay) return
    const d = new Date(firstDay.date + 'T12:00:00')
    const m = d.getMonth()
    if (m !== lastMonth) {
      labels.push({ week: wi, label: d.toLocaleDateString('en-US', { month: 'short' }) })
      lastMonth = m
    }
  })
  return labels
}

const DOW = ['S','M','T','W','T','F','S']

export function HRVCalendarClient({ days, avgHrv, latestBaseline, recoveredDays, stressedDays }: Props) {
  const [hovered, setHovered] = useState<HRVDay | null>(null)

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">💗</span>
        <h2 className="text-lg font-semibold text-text-primary">No HRV data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your health data to see your recovery calendar.
        </p>
      </div>
    )
  }

  const weeks = buildGrid(days)
  const monthLabels = getMonthLabels(weeks)
  const totalDays = days.length
  const recoveryRate = totalDays > 0 ? Math.round((recoveredDays / totalDays) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Current Baseline', value: latestBaseline ? `${latestBaseline} ms` : '—', sub: '28-day average', color: 'text-purple-400' },
          { label: 'Avg HRV', value: avgHrv ? `${avgHrv} ms` : '—', sub: 'last year', color: 'text-text-primary' },
          { label: 'Recovery Days', value: `${recoveredDays}`, sub: `${recoveryRate}% of days`, color: 'text-green-400' },
          { label: 'Stress Days', value: `${stressedDays}`, sub: 'below baseline', color: 'text-orange-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{label}</p>
            <p className="text-xs text-text-secondary opacity-60 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tooltip / hover card */}
      <div className="min-h-[40px]">
        {hovered ? (
          <div className="bg-surface rounded-lg border border-border px-4 py-2 text-sm flex items-center gap-4">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: cellColor(hovered.level) }}
            />
            <span className="text-text-primary font-medium">{fmtDate(hovered.date)}</span>
            <span className="text-purple-400 font-bold">{hovered.hrv} ms</span>
            <span className="text-text-secondary text-xs">
              Baseline {hovered.baseline} ms · {hovered.deviation > 0 ? '+' : ''}{hovered.deviation}%
            </span>
            <span className="text-xs text-text-secondary ml-auto">{LEVEL_LABELS[hovered.level]}</span>
          </div>
        ) : (
          <p className="text-xs text-text-secondary opacity-60">Hover over a cell to see details</p>
        )}
      </div>

      {/* Calendar grid */}
      <div className="bg-surface rounded-xl border border-border p-4 overflow-x-auto">
        <div className="inline-block min-w-[600px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.week === wi)
              return (
                <div key={wi} className="w-[14px] shrink-0">
                  {ml && (
                    <span className="text-[10px] text-text-secondary whitespace-nowrap">
                      {ml.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-0">
            {/* Day-of-week labels */}
            <div className="flex flex-col mr-1 gap-[2px]">
              {DOW.map((d, i) => (
                <div key={i} className="w-[10px] h-[10px] flex items-center justify-center">
                  {(i === 1 || i === 3 || i === 5) && (
                    <span className="text-[9px] text-text-secondary">{d}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      onMouseEnter={() => day && setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      className="w-[10px] h-[10px] rounded-sm transition-opacity hover:opacity-80"
                      style={{
                        background: day ? cellColor(day.level) : 'transparent',
                        cursor: day ? 'pointer' : 'default',
                      }}
                      title={day
                        ? `${day.date}: ${day.hrv}ms (${day.deviation > 0 ? '+' : ''}${day.deviation}%)`
                        : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary">
        <span>Less stressed</span>
        {[-2, -1, 0, 1, 2].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: cellColor(level) }} />
          </div>
        ))}
        <span>More recovered</span>
        <span className="ml-2 opacity-60">Colors show HRV vs 28-day rolling baseline</span>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Monthly Summary</h2>
        <div className="space-y-2">
          {(() => {
            // Group by month
            const monthMap = new Map<string, { days: HRVDay[]; recovered: number; stressed: number }>()
            for (const d of days) {
              const key = d.date.slice(0, 7)
              if (!monthMap.has(key)) monthMap.set(key, { days: [], recovered: 0, stressed: 0 })
              const m = monthMap.get(key)!
              m.days.push(d)
              if (d.level > 0) m.recovered++
              if (d.level < 0) m.stressed++
            }
            return Array.from(monthMap.entries())
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([key, { days: mDays, recovered, stressed }]) => {
                const [year, month] = key.split('-')
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                const avgHrvMonth = Math.round(mDays.reduce((s, d) => s + d.hrv, 0) / mDays.length)
                const recPct = Math.round((recovered / mDays.length) * 100)
                const strPct = Math.round((stressed / mDays.length) * 100)
                return (
                  <div key={key} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-text-primary w-32">{monthName}</span>
                    <span className="text-xs text-purple-400 w-16">{avgHrvMonth} ms avg</span>
                    <div className="flex-1 flex gap-1">
                      <div className="h-3 rounded-sm bg-green-500/60" style={{ width: `${recPct * 0.7}%`, minWidth: recPct > 0 ? 2 : 0 }} />
                      <div className="h-3 rounded-sm bg-orange-500/60" style={{ width: `${strPct * 0.7}%`, minWidth: strPct > 0 ? 2 : 0 }} />
                    </div>
                    <span className="text-xs text-text-secondary">{recPct}% recovered</span>
                  </div>
                )
              })
          })()}
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-text-primary">Reading the Calendar</h2>
        <div className="space-y-1 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: LEVEL_COLORS[2] }} />
            <span><span className="text-green-400 font-medium">Dark green</span> — HRV &gt;15% above baseline. Excellent recovery. Good day for hard training.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: LEVEL_COLORS[1] }} />
            <span><span className="text-green-300 font-medium">Light green</span> — HRV 5–15% above baseline. Good recovery. Training is OK.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: LEVEL_COLORS[0] }} />
            <span><span className="text-gray-400 font-medium">Gray</span> — Within 5% of baseline. Normal day.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: LEVEL_COLORS['-1'] }} />
            <span><span className="text-orange-400 font-medium">Orange</span> — HRV 5–15% below baseline. Mild stress. Keep training easy.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: LEVEL_COLORS['-2'] }} />
            <span><span className="text-red-400 font-medium">Red</span> — HRV &gt;15% below baseline. Significant stress or illness. Rest is recommended.</span>
          </div>
          <p className="opacity-60 pt-1">Baseline is computed as the trailing 28-day average of HRV, excluding the current day.</p>
        </div>
      </div>
    </div>
  )
}
