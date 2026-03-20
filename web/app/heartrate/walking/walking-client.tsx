'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface DaySummary {
  date: string
  avg_heart_rate: number | null
  steps: number | null
}

interface WalkingHeartRateClientProps {
  rows: DaySummary[]
}

const TEAL = '#14b8a6'

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

type FitnessLevel = 'Excellent' | 'Good' | 'Average' | 'Below Average'

function classifyFitness(avgHr: number): FitnessLevel {
  if (avgHr < 70) return 'Excellent'
  if (avgHr < 85) return 'Good'
  if (avgHr < 100) return 'Average'
  return 'Below Average'
}

const LEVEL_COLORS: Record<FitnessLevel, string> = {
  Excellent: '#22c55e',
  Good: TEAL,
  Average: '#eab308',
  'Below Average': '#ef4444',
}

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function WalkingHeartRateClient({ rows }: WalkingHeartRateClientProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🚶</span>
        <h2 className="text-lg font-semibold text-text-primary">No walking heart rate data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          This view requires days with more than 3,000 steps and a recorded heart rate. Sync your
          Apple Watch to start tracking your walking heart rate fitness.
        </p>
      </div>
    )
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  const heartRates = rows.map((r) => r.avg_heart_rate as number)
  const avgHr = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
  const minHr = Math.min(...heartRates)
  const maxHr = Math.max(...heartRates)
  const fitnessLevel = classifyFitness(avgHr)
  const levelColor = LEVEL_COLORS[fitnessLevel]

  // ─── 90-day trend data ────────────────────────────────────────────────────
  const trendData = rows.map((r) => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hr: r.avg_heart_rate as number,
    steps: r.steps as number,
  }))

  const hrMin = Math.max(40, minHr - 8)
  const hrMax = maxHr + 8

  // ─── Weekly averages ──────────────────────────────────────────────────────
  const weekMap: Map<string, number[]> = new Map()
  for (const r of rows) {
    const label = weekLabel(r.date)
    if (!weekMap.has(label)) weekMap.set(label, [])
    weekMap.get(label)!.push(r.avg_heart_rate as number)
  }
  const weeklyData = Array.from(weekMap.entries()).map(([week, hrs]) => ({
    week,
    avgHr: Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length),
  }))

  return (
    <div className="space-y-6">
      {/* Fitness level summary */}
      <div
        className="rounded-2xl border p-5 relative overflow-hidden"
        style={{ borderColor: levelColor + '44' }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${levelColor}, transparent)` }}
        />
        <div className="relative flex items-center gap-5">
          <div className="text-center shrink-0">
            <p className="text-4xl font-black tabular-nums" style={{ color: levelColor }}>
              {avgHr}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">avg bpm</p>
          </div>
          <div className="flex-1">
            <p
              className="text-lg font-bold"
              style={{ color: levelColor }}
            >
              {fitnessLevel}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">Walking heart rate fitness</p>
            <div className="mt-2 space-y-0.5 text-xs text-text-secondary">
              <p>Range: {minHr}–{maxHr} bpm over {rows.length} active days</p>
            </div>
          </div>
        </div>

        {/* Fitness bands reference */}
        <div className="relative mt-4 grid grid-cols-4 gap-1.5">
          {(Object.entries(LEVEL_COLORS) as [FitnessLevel, string][]).map(([level, color]) => (
            <div
              key={level}
              className="rounded-lg p-2 text-center border"
              style={{
                borderColor: level === fitnessLevel ? color : 'transparent',
                backgroundColor: color + (level === fitnessLevel ? '18' : '0a'),
              }}
            >
              <p className="text-xs font-semibold" style={{ color }}>{level}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {level === 'Excellent' ? '<70' : level === 'Good' ? '70–84' : level === 'Average' ? '85–99' : '≥100'} bpm
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: TEAL }}>{avgHr}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg HR (bpm)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{minHr}</p>
          <p className="text-xs text-text-secondary mt-0.5">Best Day (bpm)</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{rows.length}</p>
          <p className="text-xs text-text-secondary mt-0.5">Active Days</p>
        </div>
      </div>

      {/* 90-day trend line chart */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          90-Day Walking HR Trend
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[hrMin, hrMax]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} bpm`, 'Avg HR']}
            />
            {/* Colored band reference lines */}
            <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={85} stroke="#eab308" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine
              y={avgHr}
              stroke={TEAL}
              strokeDasharray="6 3"
              strokeOpacity={0.6}
              label={{ value: `avg ${avgHr}`, position: 'insideTopRight', fontSize: 10, fill: TEAL }}
            />
            <Line
              type="monotone"
              dataKey="hr"
              stroke={TEAL}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: TEAL }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-4 border-t border-dashed border-green-500 inline-block" />
            &lt;70 Excellent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 border-t border-dashed border-yellow-500 inline-block" />
            85 Average threshold
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 border-t border-dashed border-red-500 inline-block" />
            100 Below Average
          </span>
        </div>
      </div>

      {/* Weekly average bar chart */}
      {weeklyData.length > 1 && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Weekly Average Walking HR
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[hrMin, hrMax]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} bpm`, 'Avg Walking HR']}
                labelFormatter={(label: string) => `Week of ${label}`}
              />
              <Bar dataKey="avgHr" fill={TEAL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Science card */}
      <div
        className="bg-surface rounded-2xl border p-4 relative overflow-hidden"
        style={{ borderColor: TEAL + '44' }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${TEAL}, transparent)` }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAL }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEAL }}>
              What is Walking Heart Rate?
            </h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Walking heart rate is your average heart rate on active days — a proxy for everyday
            cardiovascular fitness. Unlike resting HR (measured at rest), walking HR reflects how
            efficiently your heart handles low-intensity movement. Lower values indicate a stronger
            heart and better aerobic capacity. Research links walking HR below 70 bpm with
            significantly reduced cardiovascular disease risk.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">
            Regular aerobic exercise, good sleep, and stress management can lower your walking HR
            over weeks. Track it alongside resting HR and HRV for a complete fitness picture.
          </p>
        </div>
      </div>
    </div>
  )
}
