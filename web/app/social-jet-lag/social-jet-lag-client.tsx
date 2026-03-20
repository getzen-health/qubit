'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Mock data ────────────────────────────────────────────────────────────────

const SJL_HOURS = 1.4
const MSW_LABEL = '2:45 AM'   // weekday sleep midpoint
const MSFSC_LABEL = '4:10 AM' // weekend sleep midpoint (corrected)
const AVG_WEEKDAY_SLEEP = 7.0
const AVG_WEEKEND_SLEEP = 9.0

// Day-of-week sleep midpoints as decimal hours past midnight
const DAY_DATA = [
  { day: 'Mon', midpoint: 2.7, isWeekend: false },
  { day: 'Tue', midpoint: 2.8, isWeekend: false },
  { day: 'Wed', midpoint: 2.6, isWeekend: false },
  { day: 'Thu', midpoint: 2.9, isWeekend: false },
  { day: 'Fri', midpoint: 3.2, isWeekend: false },
  { day: 'Sat', midpoint: 4.3, isWeekend: true },
  { day: 'Sun', midpoint: 4.1, isWeekend: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SjlLevel = 'minimal' | 'mild' | 'moderate' | 'severe'

function classifySjl(hours: number): SjlLevel {
  if (hours < 0.5) return 'minimal'
  if (hours < 1) return 'mild'
  if (hours <= 2) return 'moderate'
  return 'severe'
}

const LEVEL_META: Record<SjlLevel, { label: string; color: string; bg: string; description: string }> = {
  minimal: {
    label: 'Minimal',
    color: '#22c55e',
    bg: 'bg-green-500/10 text-green-400 border-green-500/30',
    description: 'Your circadian rhythm is well-aligned with your social schedule. Keep your sleep timing consistent to maintain this.',
  },
  mild: {
    label: 'Mild',
    color: '#eab308',
    bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    description: 'Minor misalignment between your body clock and social schedule. Small adjustments to weekend sleep timing can help.',
  },
  moderate: {
    label: 'Moderate',
    color: '#f97316',
    bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    description: 'Noticeable circadian disruption each week. Research links this level to increased metabolic and mood risks.',
  },
  severe: {
    label: 'Severe',
    color: '#ef4444',
    bg: 'bg-red-500/10 text-red-400 border-red-500/30',
    description: 'Significant weekly circadian disruption. This level is strongly associated with obesity, insulin resistance, and depression.',
  },
}

// Convert decimal hours to a clock label (e.g. 2.75 → "2:45 AM")
function decimalToTime(h: number): string {
  const totalMins = Math.round(h * 60)
  const hrs = Math.floor(totalMins / 60) % 24
  const mins = totalMins % 60
  const ampm = hrs < 12 ? 'AM' : 'PM'
  const displayHr = hrs === 0 ? 12 : hrs > 12 ? hrs - 12 : hrs
  return `${displayHr}:${String(mins).padStart(2, '0')} ${ampm}`
}

// Y-axis tick labels for the bar chart (midnight → 5 AM in 1-hour steps)
const Y_TICKS = [0, 1, 2, 3, 4, 5]
const Y_TICK_LABELS: Record<number, string> = {
  0: '12:00 AM',
  1: '1:00 AM',
  2: '2:00 AM',
  3: '3:00 AM',
  4: '4:00 AM',
  5: '5:00 AM',
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CircularGauge({ value, max = 4 }: { value: number; max?: number }) {
  const level = classifySjl(value)
  const meta = LEVEL_META[level]

  // SVG arc parameters
  const cx = 80
  const cy = 80
  const r = 60
  // Arc spans from 210° to -30° (240° total sweep, open at the bottom-centre)
  const startAngle = 210
  const endAngle = -30 // = 330° going clockwise
  const totalSweep = 240

  const pct = Math.min(value / max, 1)
  const filledSweep = pct * totalSweep

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function arcPath(fromDeg: number, toDeg: number, radius: number) {
    const start = polarToXY(fromDeg, radius)
    const end = polarToXY(toDeg, radius)
    const sweep = ((toDeg - fromDeg + 360) % 360) > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${sweep} 1 ${end.x} ${end.y}`
  }

  // Track arc: 210° → 330° (clockwise = increasing angle)
  const trackD = arcPath(startAngle, startAngle + totalSweep, r)
  // Fill arc: 210° → (210 + filledSweep)°
  const fillD = filledSweep > 0 ? arcPath(startAngle, startAngle + filledSweep, r) : null

  // Needle tip position
  const needleAngle = startAngle + filledSweep
  const needleTip = polarToXY(needleAngle, r)
  const needleBase = polarToXY(needleAngle, 12)

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="120" viewBox="0 0 160 120" aria-label={`SJL gauge: ${value}h`}>
        {/* Track */}
        <path
          d={trackD}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Segment colour stops painted as 4 equal sections */}
        {[
          { from: 210, to: 270, color: '#22c55e' },   // 0–1h minimal+mild
          { from: 270, to: 300, color: '#eab308' },   // 1–1.5h mild
          { from: 300, to: 330, color: '#f97316' },   // 1.5–2h moderate
          { from: 330, to: 360, color: '#ef4444' },   // 2–4h severe (to 450=90)
          { from: 360, to: 450, color: '#ef4444' },
        ].map((seg, i) => (
          <path
            key={i}
            d={arcPath(seg.from, seg.to, r)}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeLinecap="butt"
            opacity={0.18}
          />
        ))}
        {/* Filled value arc */}
        {fillD && (
          <path
            d={fillD}
            fill="none"
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={meta.color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill={meta.color} />
        {/* Centre value text */}
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize="22" fontWeight="700" fill="white">
          {value.toFixed(1)}h
        </text>
        <text x={cx} y={cy + 38} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">
          Social Jet Lag
        </text>
        {/* Scale labels */}
        <text x={18} y={108} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">0h</text>
        <text x={142} y={108} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">4h</text>
      </svg>
    </div>
  )
}

function ClassificationBar() {
  const segments: { label: string; color: string; width: string; range: string }[] = [
    { label: 'Minimal', color: 'bg-green-500', width: 'w-1/4', range: '<0.5h' },
    { label: 'Mild', color: 'bg-yellow-500', width: 'w-1/4', range: '0.5–1h' },
    { label: 'Moderate', color: 'bg-orange-500', width: 'w-1/4', range: '1–2h' },
    { label: 'Severe', color: 'bg-red-500', width: 'w-1/4', range: '>2h' },
  ]

  const level = classifySjl(SJL_HOURS)
  const activeIndex = ['minimal', 'mild', 'moderate', 'severe'].indexOf(level)

  return (
    <div className="mt-4 w-full">
      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-2.5 gap-px">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            className={`${seg.width} ${seg.color} transition-opacity ${i === activeIndex ? 'opacity-100' : 'opacity-25'}`}
          />
        ))}
      </div>
      {/* Labels */}
      <div className="flex mt-1.5">
        {segments.map((seg, i) => (
          <div key={seg.label} className={`${seg.width} text-center`}>
            <p className={`text-xs font-medium ${i === activeIndex ? 'text-text-primary' : 'text-text-secondary/50'}`}>
              {seg.label}
            </p>
            <p className="text-[10px] text-text-secondary/40">{seg.range}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function SocialJetLagClient() {
  const level = classifySjl(SJL_HOURS)
  const meta = LEVEL_META[level]

  return (
    <div className="space-y-4">

      {/* ── 1. SJL Score Card ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            SJL Score
          </h2>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.bg}`}>
            {meta.label}
          </span>
        </div>

        <CircularGauge value={SJL_HOURS} />

        <p className="text-sm text-text-secondary text-center mt-2 leading-relaxed">
          {meta.description}
        </p>

        <ClassificationBar />
      </div>

      {/* ── 2. Sleep Midpoints Card ────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Sleep Midpoints
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Weekday MSW */}
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-400/70 font-medium mb-1">Weekday MSW</p>
            <p className="text-2xl font-bold text-blue-400">{MSW_LABEL}</p>
            <p className="text-xs text-text-secondary mt-1">Bed 11:15 PM</p>
            <p className="text-xs text-text-secondary">Wake 6:15 AM</p>
            <div className="mt-2 pt-2 border-t border-blue-500/15">
              <p className="text-xs text-blue-400/70">{AVG_WEEKDAY_SLEEP}h avg sleep</p>
            </div>
          </div>
          {/* Weekend MSFsc */}
          <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-4 text-center">
            <p className="text-xs text-purple-400/70 font-medium mb-1">Weekend MSFsc</p>
            <p className="text-2xl font-bold text-purple-400">{MSFSC_LABEL}</p>
            <p className="text-xs text-text-secondary mt-1">Bed 12:40 AM</p>
            <p className="text-xs text-text-secondary">Wake 9:40 AM</p>
            <div className="mt-2 pt-2 border-t border-purple-500/15">
              <p className="text-xs text-purple-400/70">{AVG_WEEKEND_SLEEP}h avg sleep</p>
            </div>
          </div>
        </div>

        {/* Formula display */}
        <div className="bg-surface-secondary/50 rounded-xl p-3 text-center space-y-1">
          <p className="text-xs text-text-secondary font-medium">SJL Calculation</p>
          <p className="text-sm font-mono text-text-primary">
            |MSFsc − MSW| = |4:10 − 2:45| ={' '}
            <span style={{ color: meta.color }} className="font-bold">
              {SJL_HOURS}h
            </span>
          </p>
          <p className="text-xs text-text-secondary">
            MSFsc is corrected for sleep debt accumulated on weekdays
          </p>
        </div>
      </div>

      {/* ── 3. Day-of-Week Bar Chart ───────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-1">
          Sleep Midpoint by Day
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Showing the shift toward later sleep midpoints on weekends
        </p>

        {/* Legend */}
        <div className="flex gap-4 mb-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
            Weekdays
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-purple-500" />
            Weekend
          </span>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={DAY_DATA} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              ticks={Y_TICKS}
              domain={[0, 5]}
              tickFormatter={(v: number) => Y_TICK_LABELS[v] ?? ''}
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }}
              width={58}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [decimalToTime(v), 'Sleep Midpoint']}
              labelFormatter={(label: string) => label}
            />
            {/* Reference line at weekday average */}
            <ReferenceLine
              y={2.8}
              stroke="#3b82f6"
              strokeDasharray="4 3"
              strokeWidth={1}
              opacity={0.5}
            />
            {/* Reference line at weekend average */}
            <ReferenceLine
              y={4.2}
              stroke="#a855f7"
              strokeDasharray="4 3"
              strokeWidth={1}
              opacity={0.5}
            />
            <Bar dataKey="midpoint" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {DAY_DATA.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isWeekend ? '#a855f7' : '#3b82f6'}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 4. Tips Card ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          Reducing Social Jet Lag
        </h2>
        <div className="space-y-3">
          {[
            {
              icon: '⏰',
              title: 'Anchor your wake time',
              body: 'Keep your wake time within 1 hour on weekends. The wake signal is the strongest circadian anchor — consistency prevents clock drift.',
            },
            {
              icon: '☀️',
              title: 'Get morning light',
              body: 'Bright outdoor light within 30 minutes of waking advances your circadian phase and suppresses residual melatonin faster.',
            },
            {
              icon: '🌙',
              title: 'Avoid very late weekends',
              body: 'Staying up past 2 AM on weekends creates the same effect as flying westward. Limit bedtime shifts to under 90 minutes.',
            },
            {
              icon: '🚫',
              title: 'Skip the "social nap"',
              body: 'Napping on Sunday afternoons to recover weekend sleep debt delays your Sunday night bedtime further, compounding Monday morning misalignment.',
            },
          ].map((tip) => (
            <div key={tip.title} className="flex gap-3">
              <span className="text-lg mt-0.5 shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">{tip.title}</p>
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Science Card ───────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          The Science
        </h2>

        {/* Citation */}
        <div className="bg-surface-secondary/50 rounded-xl p-3">
          <p className="text-xs font-semibold text-text-primary mb-0.5">
            Roenneberg et al., 2012 — Current Biology
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            Analysed 65,000 participants and found that each hour of social jet lag is associated with a{' '}
            <span className="text-orange-400 font-semibold">33% higher odds of being overweight or obese</span>,
            independent of sleep duration, chronotype, and age.
          </p>
        </div>

        {/* MSFsc formula */}
        <div>
          <p className="text-xs font-semibold text-text-primary mb-1">MSFsc — Corrected Free-Day Midpoint</p>
          <div className="bg-surface-secondary/50 rounded-xl p-3">
            <p className="text-xs font-mono text-text-secondary leading-relaxed">
              MSFsc = MSF − (SD_week − SD_free) / 2
            </p>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              MSF is the raw midpoint on free days. SD_week and SD_free are average sleep durations
              on work and free days. The correction removes the confounding effect of sleeping longer
              on weekends simply to catch up on debt (not due to clock position).
            </p>
          </div>
        </div>

        {/* Health consequences */}
        <div>
          <p className="text-xs font-semibold text-text-primary mb-2">Associated Health Consequences</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Obesity risk', detail: '+33% per hour', color: 'text-red-400' },
              { label: 'Insulin resistance', detail: 'Reduced glucose clearance', color: 'text-orange-400' },
              { label: 'Elevated CRP', detail: 'Systemic inflammation', color: 'text-yellow-400' },
              { label: 'Depression risk', detail: 'Mood regulation disruption', color: 'text-blue-400' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-secondary/40 rounded-lg p-3">
                <p className={`text-xs font-semibold ${item.color}`}>{item.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chronotype vs SJL distinction */}
        <div>
          <p className="text-xs font-semibold text-text-primary mb-1">Chronotype vs Social Jet Lag</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="text-text-primary font-medium">Chronotype</span> is your genetically-determined
            preferred sleep timing — being a night owl is not inherently unhealthy.{' '}
            <span className="text-text-primary font-medium">Social jet lag</span> is the mismatch between that
            preferred timing and your forced schedule. A night owl who can sleep and wake late consistently has
            zero social jet lag; a night owl forced to rise early every weekday may have severe social jet lag.
          </p>
        </div>
      </div>

    </div>
  )
}
