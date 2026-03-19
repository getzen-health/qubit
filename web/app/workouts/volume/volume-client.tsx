'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { VolumeData, WeekPoint } from './page'

interface Props {
  data: VolumeData
}

function fmt1(n: number) { return n.toFixed(1) }
function fmt0(n: number) { return Math.round(n).toString() }

// Custom tooltip for stacked bar
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, p) => a + (p.value || 0), 0)
  return (
    <div className="bg-surface-primary border border-border rounded-lg p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-text-primary mb-2">{label}</p>
      {payload.filter(p => p.value > 0).reverse().map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="text-text-secondary tabular-nums">{fmt0(p.value)} min</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-border">
        <span className="text-text-secondary font-medium">Total</span>
        <span className="font-bold tabular-nums">{fmt0(total)} min</span>
      </div>
    </div>
  )
}

export function VolumeClient({ data }: Props) {
  const { weeks, groups, groupColors, totalHours, avgWeeklyHours, peakWeekMins, peakWeekLabel, activeSports } = data

  // Build rolling 4-week average for the line chart
  const weeklyTotals = weeks.map((w) => ({ weekLabel: w.weekLabel, totalMins: w.totalMins }))
  const rolling4w = weeklyTotals.map((_, i) => {
    const slice = weeklyTotals.slice(Math.max(0, i - 3), i + 1)
    return { weekLabel: weeklyTotals[i].weekLabel, avg: slice.reduce((a, s) => a + s.totalMins, 0) / slice.length }
  })

  // Tick interval for 52 weeks (show ~13 labels = every 4 weeks)
  const tickInterval = Math.floor(weeks.length / 12)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl mb-1">⏱️</div>
          <div className="text-xl font-bold text-text-primary tabular-nums">{fmt1(totalHours)}h</div>
          <div className="text-xs text-text-secondary">Total training</div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-xl font-bold text-text-primary tabular-nums">{fmt1(avgWeeklyHours)}h</div>
          <div className="text-xs text-text-secondary">Avg per week</div>
        </div>
        <div className="bg-surface-primary rounded-xl p-4 text-center border border-border">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-xl font-bold text-text-primary tabular-nums">{fmt0(peakWeekMins / 60)}h</div>
          <div className="text-xs text-text-secondary">Peak week ({peakWeekLabel})</div>
        </div>
      </div>

      {/* Sport breakdown */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Sport Mix (last 52 weeks)</h2>
        <div className="space-y-2">
          {activeSports.map((s) => {
            const pct = totalHours > 0 ? (s.totalMins / 60) / totalHours * 100 : 0
            return (
              <div key={s.group} className="flex items-center gap-3">
                <div className="w-20 text-sm text-text-secondary">{s.group}</div>
                <div className="flex-1 h-5 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <div className="w-24 text-right text-sm tabular-nums text-text-primary">
                  {fmt1(s.totalMins / 60)}h ({fmt0(pct)}%)
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stacked bar chart: weekly volume by sport */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-4">Weekly Volume by Sport (minutes)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeks} margin={{ left: -20, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 9 }}
              interval={tickInterval}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {groups.map((g) => (
              <Bar key={g} dataKey={g} stackId="sports" fill={groupColors[g]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rolling 4-week average total volume */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-1">Total Weekly Volume + 4-Week Average</h2>
        <p className="text-xs text-text-secondary mb-4">Grey bars = weekly total; orange line = 4-week rolling average</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeks} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 9 }} interval={tickInterval} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v: number, name: string) => [`${fmt0(v)} min`, name]}
              labelFormatter={(l) => l}
            />
            <Bar dataKey="totalMins" fill="#94a3b8" opacity={0.5} name="Weekly total" />
            <Line
              data={rolling4w}
              dataKey="avg"
              name="4-week avg"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly volume table (last 12 weeks) */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Last 12 Weeks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left pb-2">Week</th>
                {groups.slice(0, 4).map((g) => (
                  <th key={g} className="text-right pb-2" style={{ color: groupColors[g] }}>{g}</th>
                ))}
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {weeks.slice(-12).reverse().map((w, i) => (
                <tr key={w.weekStart} className={i % 2 === 0 ? '' : 'bg-surface-secondary'}>
                  <td className="py-1.5 text-text-secondary text-xs">{w.weekLabel}</td>
                  {groups.slice(0, 4).map((g) => (
                    <td key={g} className="py-1.5 text-right tabular-nums text-xs">
                      {(w[g] as number) > 0 ? `${fmt0(w[g] as number)}m` : '—'}
                    </td>
                  ))}
                  <td className="py-1.5 text-right tabular-nums text-xs font-medium">
                    {w.totalMins > 0 ? `${fmt0(w.totalMins)}m` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {groups.length > 4 && (
          <p className="text-xs text-text-secondary mt-2">* Table shows top 4 sports. Chart shows all.</p>
        )}
      </div>

      {/* Guidelines */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
        <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">📊 Volume Guidelines</h3>
        <p className="text-sm text-text-secondary">
          Most endurance athletes aim for 6–12 hours of training per week during base-building phases.
          The 10% rule suggests increasing weekly volume by no more than 10% week-over-week to reduce
          injury risk. Look for consistent volume with occasional recovery weeks (reduced by 20–30%)
          every 3–4 weeks for optimal adaptation.
        </p>
      </div>
    </div>
  )
}
