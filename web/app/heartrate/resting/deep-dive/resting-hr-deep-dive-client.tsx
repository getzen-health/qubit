'use client'

import {
  ScatterChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendPoint {
  date: string
  rhr: number
  rolling: number
}

interface MonthlyPoint {
  month: string
  avg: number
  color: string
  classLabel: string
}

interface DowPoint {
  label: string
  avg: number
}

interface Props {
  trendData: TrendPoint[]
  monthlyData: MonthlyPoint[]
  dowData: DowPoint[]
  latestRhr: number
  avg90: number
  lowest12mo: number
  highest12mo: number
  trend30: number
}

// ─── AHA classification table definition ─────────────────────────────────────

const AHA_CLASSES = [
  { label: 'Athletic', range: '< 50 bpm', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)', dot: 'bg-blue-500', maxRhr: 49 },
  { label: 'Excellent', range: '50–59 bpm', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', dot: 'bg-green-500', maxRhr: 59 },
  { label: 'Good', range: '60–67 bpm', color: '#14b8a6', bgColor: 'rgba(20,184,166,0.1)', borderColor: 'rgba(20,184,166,0.3)', dot: 'bg-teal-500', maxRhr: 67 },
  { label: 'Average', range: '68–75 bpm', color: '#eab308', bgColor: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.3)', dot: 'bg-yellow-500', maxRhr: 75 },
  { label: 'Below Average', range: '76–84 bpm', color: '#f97316', bgColor: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)', dot: 'bg-orange-500', maxRhr: 84 },
  { label: 'Poor', range: '≥ 85 bpm', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', dot: 'bg-red-500', maxRhr: Infinity },
]

function getAhaClass(rhr: number) {
  if (rhr < 50) return AHA_CLASSES[0]
  if (rhr < 60) return AHA_CLASSES[1]
  if (rhr < 68) return AHA_CLASSES[2]
  if (rhr < 76) return AHA_CLASSES[3]
  if (rhr < 85) return AHA_CLASSES[4]
  return AHA_CLASSES[5]
}

// ─── Shared tooltip style ─────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendDotShape(props: { cx?: number; cy?: number; payload?: TrendPoint }) {
  const { cx = 0, cy = 0 } = props
  return <circle cx={cx} cy={cy} r={2} fill="rgba(248,113,113,0.45)" stroke="none" />
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RestingHRDeepDiveClient({
  trendData,
  monthlyData,
  dowData,
  latestRhr,
  avg90,
  lowest12mo,
  highest12mo,
  trend30,
}: Props) {
  const currentClass = getAhaClass(latestRhr)
  const trendImproving = trend30 < 0
  const trendLabel = trendImproving
    ? `${Math.abs(trend30)} bpm improving`
    : trend30 > 0
    ? `+${trend30} bpm rising`
    : 'Stable'
  const trendColor = trendImproving ? '#22c55e' : trend30 > 0 ? '#f97316' : '#94a3b8'

  // Build scatter + rolling for the composed chart
  const scatterPoints = trendData.map((p) => ({ date: fmtDate(p.date), rhr: p.rhr }))
  const rollingPoints = trendData.map((p) => ({ date: fmtDate(p.date), rolling: p.rolling }))

  // Merge for ComposedChart (one dataset, both keys)
  const composedData = trendData.map((p) => ({
    date: fmtDate(p.date),
    rhr: p.rhr,
    rolling: p.rolling,
  }))

  // Avg bpm across DOW for reference line
  const dowAvg = Math.round(dowData.reduce((s, d) => s + d.avg, 0) / dowData.length)

  return (
    <div className="space-y-6">

      {/* ── Summary card ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: currentClass.bgColor, borderColor: currentClass.borderColor }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❤️</span>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">
                Latest Resting HR
              </p>
              <p className="text-5xl font-bold text-text-primary tabular-nums leading-none mt-0.5">
                {latestRhr}
                <span className="text-xl font-normal text-text-secondary ml-1">bpm</span>
              </p>
            </div>
          </div>
          <span
            className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: currentClass.bgColor, color: currentClass.color, border: `1px solid ${currentClass.borderColor}` }}
          >
            {currentClass.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5 sm:grid-cols-4">
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary tabular-nums">{avg90} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">90-day avg</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary tabular-nums">{lowest12mo} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Lowest 12mo</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-primary tabular-nums">{highest12mo} bpm</p>
            <p className="text-xs text-text-secondary mt-0.5">Highest 12mo</p>
          </div>
          <div className="bg-background/40 rounded-xl p-3 text-center">
            <p className="text-lg font-bold tabular-nums" style={{ color: trendColor }}>
              {trendImproving ? '↓' : trend30 > 0 ? '↑' : '→'} {trendLabel}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">30-day trend</p>
          </div>
        </div>
      </div>

      {/* ── 12-month trend chart ────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">12-Month RHR Trend</h2>
        <p className="text-xs text-text-secondary mt-0.5 mb-3">
          Daily readings (dots) with 14-day rolling average — a downward slope indicates improving aerobic fitness
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={composedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(composedData.length / 6)}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={30}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [
                `${v} bpm`,
                name === 'rolling' ? '14-day avg' : 'Daily RHR',
              ]}
            />
            <ReferenceLine
              y={avg90}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="6 3"
              label={{ value: `${avg90} avg`, fill: '#666', fontSize: 9, position: 'insideTopRight' }}
            />
            {/* Scatter dots for daily readings */}
            <Line
              type="monotone"
              dataKey="rhr"
              stroke="rgba(248,113,113,0.5)"
              strokeWidth={0}
              dot={{ r: 2, fill: 'rgba(248,113,113,0.45)', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#f87171' }}
              name="Daily RHR"
              isAnimationActive={false}
            />
            {/* 14-day rolling average line */}
            <Line
              type="monotone"
              dataKey="rolling"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444' }}
              name="rolling"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-2 justify-center text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(248,113,113,0.45)' }} />
            Daily reading
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 bg-red-500" />
            14-day rolling avg
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px border-t border-dashed border-white/20" />
            Baseline
          </div>
        </div>
      </div>

      {/* ── Monthly average bar chart ────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">Monthly Average RHR</h2>
        <p className="text-xs text-text-secondary mt-0.5 mb-3">
          Bar colour reflects AHA fitness classification for that month
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={30}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _: string, props: { payload?: MonthlyPoint }) => [
                `${v} bpm — ${props.payload?.classLabel ?? ''}`,
                'Avg RHR',
              ]}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]} name="Avg RHR">
              {monthlyData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Day-of-week bar chart ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">Day-of-Week Pattern</h2>
        <p className="text-xs text-text-secondary mt-0.5 mb-3">
          RHR tends to be highest Monday (post-weekend recovery) and lowest midweek — a sign of good weekday activity
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={dowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={30}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} bpm`, 'Avg RHR']}
            />
            <ReferenceLine
              y={dowAvg}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="4 3"
              label={{ value: `${dowAvg} avg`, fill: '#666', fontSize: 9, position: 'insideTopRight' }}
            />
            <Bar dataKey="avg" radius={[3, 3, 0, 0]} name="Avg RHR">
              {dowData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.avg < dowAvg ? '#22c55e' : d.avg === dowAvg ? '#94a3b8' : '#f87171'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-2 justify-center text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            Below average (better)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
            Above average
          </div>
        </div>
      </div>

      {/* ── AHA Fitness Classification table ────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-text-primary">AHA Fitness Classification</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Based on American Heart Association resting heart rate guidelines for adults
          </p>
        </div>

        <div className="divide-y divide-border">
          {AHA_CLASSES.map((cls) => {
            const isCurrent = cls.label === currentClass.label
            return (
              <div
                key={cls.label}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={isCurrent ? { background: cls.bgColor } : undefined}
              >
                {/* Colour dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: cls.color }}
                />

                {/* Class name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: isCurrent ? cls.color : undefined }}
                    >
                      {cls.label}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: cls.borderColor, color: cls.color }}
                      >
                        You are here
                      </span>
                    )}
                  </div>
                </div>

                {/* BPM range */}
                <span className="text-xs text-text-secondary tabular-nums shrink-0">
                  {cls.range}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-text-secondary/50 px-4 py-3">
          Ranges are general guidelines for adults aged 18+. Individual variation is normal.
        </p>
      </div>

    </div>
  )
}
