'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

export interface DayEntry {
  date: string
  hrv: number
  zone: 'green' | 'yellow' | 'orange'
  hadWorkout: boolean
  recovery: number | null
  rhr: number | null
  sleepMins: number | null
  rolling7: number
}

export interface HRVZoneData {
  days: DayEntry[]
  totalDays: number
  greenDays: number
  yellowDays: number
  orangeDays: number
  baseline: number
  optimalThreshold: number
  currentZone: 'green' | 'yellow' | 'orange' | null
  currentStreak: number
  bestGreenStreak: number
  avgHrvAfterWorkout: number | null
  avgHrvAfterRest: number | null
}

const ZONE_COLOR = {
  green:  '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
}

const ZONE_LABEL = {
  green:  'Optimal',
  yellow: 'Normal',
  orange: 'Reduced',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDate()
  if (day === 1 || day === 15) return String(day)
  return ''
}

export function HRVZonesClient({ data }: { data: HRVZoneData }) {
  const { days, totalDays, greenDays, yellowDays, orangeDays, baseline, optimalThreshold,
    currentZone, currentStreak, bestGreenStreak, avgHrvAfterWorkout, avgHrvAfterRest } = data

  if (totalDays < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">💗</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync at least 7 days of HRV data to see your recovery zones.
        </p>
      </div>
    )
  }

  const pctGreen  = Math.round((greenDays  / totalDays) * 100)
  const pctYellow = Math.round((yellowDays / totalDays) * 100)
  const pctOrange = Math.round((orangeDays / totalDays) * 100)

  return (
    <div className="space-y-4">

      {/* Zone explanation */}
      <p className="text-sm text-text-secondary opacity-70">
        Zones are personalised to your 90-day HRV range — not fixed numbers.
        Green = top 25 % of your range. Orange = below your median.
      </p>

      {/* Current zone banner */}
      {currentZone && (
        <div
          className="flex items-center gap-4 p-4 rounded-xl border"
          style={{
            background: `${ZONE_COLOR[currentZone]}18`,
            borderColor: `${ZONE_COLOR[currentZone]}40`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: ZONE_COLOR[currentZone] }}
          />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ZONE_COLOR[currentZone] }}>
              Current Zone · {ZONE_LABEL[currentZone]}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {currentStreak} consecutive {ZONE_LABEL[currentZone].toLowerCase()} day{currentStreak !== 1 ? 's' : ''}
            </p>
          </div>
          {bestGreenStreak > 0 && (
            <div className="text-right">
              <p className="text-xs text-text-secondary opacity-60">Best green streak</p>
              <p className="text-sm font-bold" style={{ color: ZONE_COLOR.green }}>{bestGreenStreak}d</p>
            </div>
          )}
        </div>
      )}

      {/* Zone distribution */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Zone Distribution</p>

        {/* Visual bar */}
        <div className="flex rounded-full overflow-hidden h-5 mb-4">
          {pctGreen  > 0 && <div style={{ width: `${pctGreen}%`,  background: ZONE_COLOR.green  }} title={`${pctGreen}% Optimal`}  />}
          {pctYellow > 0 && <div style={{ width: `${pctYellow}%`, background: ZONE_COLOR.yellow }} title={`${pctYellow}% Normal`}   />}
          {pctOrange > 0 && <div style={{ width: `${pctOrange}%`, background: ZONE_COLOR.orange }} title={`${pctOrange}% Reduced`}  />}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {([
            { zone: 'green' as const,  days: greenDays,  pct: pctGreen  },
            { zone: 'yellow' as const, days: yellowDays, pct: pctYellow },
            { zone: 'orange' as const, days: orangeDays, pct: pctOrange },
          ]).map(({ zone, days: cnt, pct }) => (
            <div key={zone} className="rounded-lg p-3" style={{ background: `${ZONE_COLOR[zone]}14` }}>
              <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5" style={{ background: ZONE_COLOR[zone] }} />
              <p className="text-lg font-bold text-text-primary">{pct}%</p>
              <p className="text-xs" style={{ color: ZONE_COLOR[zone] }}>{ZONE_LABEL[zone]}</p>
              <p className="text-xs text-text-secondary opacity-60 mt-0.5">{cnt} days</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs text-text-secondary mt-4 pt-4 border-t border-border">
          <span>Baseline (median): <strong className="text-text-primary">{baseline} ms</strong></span>
          <span>Optimal threshold: <strong className="text-text-primary">{optimalThreshold} ms</strong></span>
        </div>
      </div>

      {/* HRV timeline with zone colours */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-1">HRV Timeline</p>
        <p className="text-xs text-text-secondary opacity-70 mb-4">
          Bars coloured by zone · white line = 7-day rolling average
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={shortDate}
              interval={0}
            />
            <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                name === 'rolling7' ? `${Math.round(v)} ms (7d avg)` : `${Math.round(v)} ms`,
                name === 'rolling7' ? 'Rolling avg' : 'HRV',
              ]}
              labelFormatter={(label) => new Date(label + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            />
            <ReferenceLine y={optimalThreshold} stroke={`${ZONE_COLOR.green}60`} strokeDasharray="4 2" />
            <ReferenceLine y={baseline}          stroke={`${ZONE_COLOR.yellow}60`} strokeDasharray="4 2" />
            <Bar dataKey="hrv" radius={[2, 2, 0, 0]} maxBarSize={8}>
              {days.map((d, i) => (
                <Cell key={i} fill={`${ZONE_COLOR[d.zone]}cc`} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="rolling7"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 rounded" style={{ background: ZONE_COLOR.green   }} /> ≥{optimalThreshold} ms
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 rounded" style={{ background: ZONE_COLOR.yellow  }} /> ≥{baseline} ms
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 rounded" style={{ background: ZONE_COLOR.orange  }} /> &lt;{baseline} ms
          </span>
        </div>
      </div>

      {/* Workout impact */}
      {avgHrvAfterWorkout !== null && avgHrvAfterRest !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Workout Impact on HRV</p>
          <p className="text-xs text-text-secondary opacity-70 mb-4">
            Average HRV the day after a workout vs the day after a rest day
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{avgHrvAfterWorkout} ms</p>
              <p className="text-xs text-text-secondary mt-1">Day after workout</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{avgHrvAfterRest} ms</p>
              <p className="text-xs text-text-secondary mt-1">Day after rest</p>
            </div>
          </div>
          {avgHrvAfterWorkout >= avgHrvAfterRest ? (
            <p className="text-xs text-green-400 text-center mt-3">
              Your HRV is higher after workout days — you recover well from training.
            </p>
          ) : (
            <p className="text-xs text-orange-400 text-center mt-3">
              Your HRV dips after workout days — ensure adequate recovery between sessions.
            </p>
          )}
        </div>
      )}

      {/* Zone streak heatmap */}
      <div className="bg-surface rounded-xl border border-border p-4 overflow-x-auto">
        <p className="text-sm font-semibold text-text-primary mb-3">Zone History</p>
        <div className="flex gap-1 min-w-max">
          {days.map((d) => (
            <div
              key={d.date}
              className="w-4 h-8 rounded-sm shrink-0"
              style={{ background: `${ZONE_COLOR[d.zone]}cc` }}
              title={`${d.date}: ${Math.round(d.hrv)} ms (${ZONE_LABEL[d.zone]})`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
          {(['green', 'yellow', 'orange'] as const).map((z) => (
            <span key={z} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: ZONE_COLOR[z] }} />
              {ZONE_LABEL[z]}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        {totalDays} days · Zones relative to your personal 90-day range · Not medical advice
      </p>
    </div>
  )
}
