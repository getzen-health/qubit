'use client'

import { FlaskConical, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts'
import type { DayPoint } from './page'

interface TrainingLoadClientProps {
  days: DayPoint[]
}

// ─── Form zones ───────────────────────────────────────────────────────────────

interface FormZone {
  label: string
  range: string
  description: string
  color: string
  active: boolean
}

function getFormZones(tsb: number): FormZone[] {
  return [
    {
      label: 'Peak Form',
      range: '> +25',
      description: 'Fully rested. Ideal for A-priority races. Fitness may begin declining.',
      color: '#22d3ee',
      active: tsb > 25,
    },
    {
      label: 'Optimal',
      range: '+10 to +25',
      description: 'Classic race-ready window. Fatigue absorbed, fitness preserved.',
      color: '#60a5fa',
      active: tsb >= 10 && tsb <= 25,
    },
    {
      label: 'Fresh',
      range: '0 to +10',
      description: 'Good for B-races or key quality sessions. Slight freshness advantage.',
      color: '#4ade80',
      active: tsb >= 0 && tsb < 10,
    },
    {
      label: 'Fatigued',
      range: '−30 to 0',
      description: 'Normal productive training zone. Some fatigue is expected and beneficial.',
      color: '#fb923c',
      active: tsb >= -30 && tsb < 0,
    },
    {
      label: 'Overreaching',
      range: '< −30',
      description: 'Excessive fatigue. Rest required. Injury and illness risk elevated.',
      color: '#f87171',
      active: tsb < -30,
    },
  ]
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipEntry {
  dataKey: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const ctl = payload.find((p) => p.dataKey === 'ctl')?.value
  const atl = payload.find((p) => p.dataKey === 'atl')?.value
  const tsb = payload.find((p) => p.dataKey === 'tsb')?.value
  const tss = payload.find((p) => p.dataKey === 'tss')?.value

  const tsbColor =
    tsb === undefined ? '#9ca3af'
    : tsb > 10 ? '#60a5fa'
    : tsb > 0 ? '#4ade80'
    : tsb > -30 ? '#fb923c'
    : '#f87171'

  return (
    <div
      className="rounded-xl border border-white/10 shadow-xl"
      style={{
        background: 'rgba(10,10,18,0.95)',
        backdropFilter: 'blur(12px)',
        padding: '12px 16px',
        fontSize: 12,
        minWidth: 160,
      }}
    >
      <p className="text-white/50 font-medium mb-2 text-xs uppercase tracking-widest">{label}</p>
      {tss !== undefined && (
        <div className="flex justify-between gap-6 mb-1">
          <span className="text-white/40">TSS</span>
          <span className="text-white font-semibold">{Math.round(tss)}</span>
        </div>
      )}
      {ctl !== undefined && (
        <div className="flex justify-between gap-6 mb-1">
          <span style={{ color: '#60a5fa' }}>Fitness (CTL)</span>
          <span className="text-white font-semibold">{ctl}</span>
        </div>
      )}
      {atl !== undefined && (
        <div className="flex justify-between gap-6 mb-1">
          <span style={{ color: '#fb923c' }}>Fatigue (ATL)</span>
          <span className="text-white font-semibold">{atl}</span>
        </div>
      )}
      {tsb !== undefined && (
        <div className="flex justify-between gap-6">
          <span style={{ color: tsbColor }}>Form (TSB)</span>
          <span className="font-semibold" style={{ color: tsbColor }}>
            {tsb > 0 ? '+' : ''}{tsb}
          </span>
        </div>
      )}
    </div>
  )
}

function AcwrTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const acwr = payload.find((p) => p.dataKey === 'acwr')?.value
  if (acwr === undefined) return null
  const color = acwr > 1.5 ? '#f87171' : acwr > 1.3 ? '#fb923c' : '#4ade80'
  return (
    <div
      className="rounded-xl border border-white/10 shadow-xl"
      style={{
        background: 'rgba(10,10,18,0.95)',
        backdropFilter: 'blur(12px)',
        padding: '10px 14px',
        fontSize: 12,
        minWidth: 130,
      }}
    >
      <p className="text-white/50 font-medium mb-1.5 text-xs uppercase tracking-widest">{label}</p>
      <div className="flex justify-between gap-5">
        <span className="text-white/40">ACWR</span>
        <span className="font-semibold" style={{ color }}>{acwr.toFixed(2)}</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrainingLoadClient({ days }: TrainingLoadClientProps) {
  const hasWorkouts = days.some((d) => d.tss > 0)

  if (!hasWorkouts) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📈</span>
        <h2 className="text-lg font-semibold text-text-primary">No workout data yet</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync your iPhone to import workouts. Training load curves build after a few weeks of data.
        </p>
      </div>
    )
  }

  const today = days[days.length - 1]
  const latestAcwr = today.acwr
  const zones = getFormZones(today.tsb)
  const currentZone = zones.find((z) => z.active) ?? zones[2]

  // Ramp rate: CTL change over past 7 days
  const weekAgo = days.length >= 8 ? days[days.length - 8] : days[0]
  const rampRate = Math.round((today.ctl - weekAgo.ctl) * 10) / 10

  // Peak CTL in window
  const peakCtl = Math.max(...days.map((d) => d.ctl))
  const peakDay = days.find((d) => d.ctl === peakCtl)

  // Chart data: add atlOverload field for red highlight when ACWR > 1.5
  const chartData = days.map((d) => ({
    ...d,
    atlOverload: d.acwr > 1.5 ? d.atl : null,
  }))

  const tickInterval = Math.floor(days.length / 6)

  // Weekly TSS for bar chart
  const weeklyTSS: Record<string, number> = {}
  for (const d of days) {
    const date = new Date(d.date + 'T00:00:00')
    const dow = (date.getDay() + 6) % 7
    const monday = new Date(date)
    monday.setDate(date.getDate() - dow)
    const weekKey = monday.toISOString().slice(0, 10)
    weeklyTSS[weekKey] = (weeklyTSS[weekKey] ?? 0) + d.tss
  }
  const weeklyData = Object.entries(weeklyTSS)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, tss]) => ({
      week: new Date(week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tss,
    }))

  return (
    <div className="space-y-5">

      {/* ── ACWR injury risk warning ──────────────────────────────────── */}
      {latestAcwr > 1.5 && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-sm text-red-300">
          ⚠️ ACWR {latestAcwr.toFixed(2)} — above 1.5 threshold. Reduce training load to prevent injury.
          <span className="text-xs text-red-400 ml-2">(Foster 2001)</span>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* CTL */}
        <div className="bg-surface rounded-2xl border border-border p-4 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ background: 'radial-gradient(ellipse at top left, #60a5fa, transparent 70%)' }}
          />
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Fitness</p>
          <p className="text-3xl font-black text-blue-400 tabular-nums leading-none mb-1">{today.ctl}</p>
          <p className="text-xs text-text-tertiary">CTL · 42-day avg</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-text-secondary">
            <span className="text-text-tertiary">Peak:</span>
            <span className="text-blue-400 font-semibold">{peakCtl}</span>
            <span className="text-text-tertiary ml-1">{peakDay?.label}</span>
          </div>
        </div>

        {/* ATL */}
        <div className="bg-surface rounded-2xl border border-border p-4 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ background: 'radial-gradient(ellipse at top left, #fb923c, transparent 70%)' }}
          />
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Fatigue</p>
          <p className="text-3xl font-black text-orange-400 tabular-nums leading-none mb-1">{today.atl}</p>
          <p className="text-xs text-text-tertiary">ATL · 7-day avg</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {rampRate > 0 ? (
              <TrendingUp className="w-3 h-3 text-orange-400" />
            ) : rampRate < 0 ? (
              <TrendingDown className="w-3 h-3 text-blue-400" />
            ) : (
              <Minus className="w-3 h-3 text-text-tertiary" />
            )}
            <span className="text-text-secondary">
              CTL{' '}
              <span className={rampRate > 0 ? 'text-green-400 font-semibold' : rampRate < 0 ? 'text-blue-400 font-semibold' : 'text-text-tertiary'}>
                {rampRate >= 0 ? '+' : ''}{rampRate}
              </span>
              {' '}/ wk
            </span>
          </div>
        </div>

        {/* TSB */}
        <div
          className="rounded-2xl border p-4 relative overflow-hidden"
          style={{ background: `${currentZone.color}08`, borderColor: `${currentZone.color}25` }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ background: `radial-gradient(ellipse at top left, ${currentZone.color}, transparent 70%)` }}
          />
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: `${currentZone.color}99` }}>
            Form
          </p>
          <p className="text-3xl font-black tabular-nums leading-none mb-1" style={{ color: currentZone.color }}>
            {today.tsb > 0 ? '+' : ''}{today.tsb}
          </p>
          <p className="text-xs" style={{ color: `${currentZone.color}70` }}>TSB · CTL − ATL</p>
          <div className="mt-3">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${currentZone.color}20`, color: currentZone.color }}
            >
              {currentZone.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Performance Management Chart ──────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Performance Management Chart</h2>
            <p className="text-xs text-text-secondary mt-0.5">90 days · real workout data</p>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-text-secondary shrink-0">
            {[
              { color: '#60a5fa', label: 'CTL', dash: false },
              { color: '#fb923c', label: 'ATL', dash: true },
              { color: '#6ee7b7', label: 'TSB', dash: false },
            ].map(({ color, label, dash }) => (
              <div key={label} className="flex items-center gap-1.5">
                <svg width="20" height="8" viewBox="0 0 20 8">
                  {dash ? (
                    <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
                  ) : (
                    <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2.5" />
                  )}
                </svg>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tsbPosGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="tsbNegGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="atlOverloadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <ReferenceLine y={25} stroke="rgba(96,165,250,0.2)" strokeDasharray="3 5" />
            <ReferenceLine y={-30} stroke="rgba(248,113,113,0.2)" strokeDasharray="3 5" />

            {/* TSB shaded areas */}
            <Area type="monotone" dataKey="tsbPos" fill="url(#tsbPosGrad)" stroke="none" connectNulls={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="tsbNeg" fill="url(#tsbNegGrad)" stroke="none" connectNulls={false} isAnimationActive={false} />

            {/* Red ATL highlight when ACWR > 1.5 (injury risk zone) */}
            <Area type="monotone" dataKey="atlOverload" fill="url(#atlOverloadGrad)" stroke="none" connectNulls={false} isAnimationActive={false} />

            {/* CTL — primary line */}
            <Line type="monotone" dataKey="ctl" stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }} />
            {/* ATL — dashed */}
            <Line type="monotone" dataKey="atl" stroke="#fb923c" strokeWidth={1.75} strokeDasharray="5 3" dot={false} activeDot={{ r: 3, fill: '#fb923c', strokeWidth: 0 }} />
            {/* TSB — fine emerald line */}
            <Line type="monotone" dataKey="tsb" stroke="#6ee7b7" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#6ee7b7', strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
          <div className="flex items-center gap-1">
            <div className="w-3 h-px" style={{ background: 'rgba(96,165,250,0.4)' }} />
            <span>TSB +25</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-px" style={{ background: 'rgba(248,113,113,0.4)' }} />
            <span>TSB −30</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm opacity-50" style={{ background: '#ef4444' }} />
            <span>ACWR &gt; 1.5 (injury risk)</span>
          </div>
        </div>
      </div>

      {/* ── ACWR trend chart ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Acute:Chronic Workload Ratio</h2>
            <p className="text-xs text-text-secondary mt-0.5">ATL ÷ CTL · injury risk above 1.5</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
            style={{
              color: latestAcwr > 1.5 ? '#f87171' : latestAcwr > 1.3 ? '#fb923c' : '#4ade80',
              borderColor: latestAcwr > 1.5 ? '#f8717140' : latestAcwr > 1.3 ? '#fb923c40' : '#4ade8040',
              background: latestAcwr > 1.5 ? '#f8717112' : latestAcwr > 1.3 ? '#fb923c12' : '#4ade8012',
            }}
          >
            {latestAcwr.toFixed(2)}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
              width={32}
              domain={[0, 'auto']}
            />
            <Tooltip content={<AcwrTooltip />} />
            <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <ReferenceLine
              y={1.5}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeOpacity={0.7}
              label={{ value: '⚠️ Injury Risk', position: 'insideTopRight', fontSize: 10, fill: '#f87171', dy: -4 }}
            />
            <Area type="monotone" dataKey="acwr" fill="url(#acwrGrad)" stroke="#818cf8" strokeWidth={1.75} dot={false} activeDot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── TSB Form Zones table ──────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">TSB Form Zones</h2>
          <p className="text-xs text-text-secondary mt-0.5">Current zone highlighted</p>
        </div>
        <div className="divide-y divide-border">
          {zones.map((zone) => (
            <div
              key={zone.label}
              className={`flex items-start gap-3 px-4 sm:px-5 py-3.5 transition-colors ${zone.active ? 'bg-white/[0.02]' : ''}`}
            >
              <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: zone.color, boxShadow: zone.active ? `0 0 8px ${zone.color}80` : 'none' }}
                />
                {zone.active && (
                  <div className="w-px h-3 rounded-full" style={{ background: zone.color + '60' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: zone.active ? zone.color : undefined }}>
                    {zone.label}
                  </span>
                  <code
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${zone.color}12`, color: zone.color, border: `1px solid ${zone.color}25` }}
                  >
                    {zone.range}
                  </code>
                  {zone.active && (
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: `${zone.color}20`, color: zone.color }}
                    >
                      ← you are here
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">{zone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly training stress ────────────────────────────────────── */}
      {weeklyData.length >= 2 && (
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Weekly Training Stress</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [Math.round(v), 'TSS']}
              />
              <Bar dataKey="tss" name="TSS" fill="#818cf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Science & Methodology ─────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
          <FlaskConical className="w-4 h-4 text-text-secondary shrink-0" />
          <h2 className="text-sm font-semibold text-text-primary">Science &amp; Methodology</h2>
        </div>
        <div className="px-4 sm:px-5 py-4 space-y-4">
          <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
            <p>
              The <span className="text-text-primary font-medium">Bannister impulse-response model</span> (1991) treats
              athletic adaptation as the superposition of two competing processes — a slow-building fitness component
              and a fast-decaying fatigue component — both driven by the same training impulse (TSS).
            </p>
            <p>
              Each day&apos;s load is expressed as a <span className="text-text-primary font-medium">Training Stress Score</span>,
              estimated from heart rate data (HR ratio² × duration) using a simplified TRIMP approach.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-secondary p-3.5 space-y-2 font-mono text-xs">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-text-secondary">
              <div>
                <span className="text-blue-400">CTL</span>
                <span className="text-text-tertiary"> = CTL</span>
                <sub className="text-text-tertiary text-[9px]">yesterday</sub>
                <span className="text-text-tertiary"> + (TSS − CTL) × k</span>
                <sub className="text-blue-400/80 text-[9px]">42</sub>
              </div>
              <div>
                <span className="text-orange-400">ATL</span>
                <span className="text-text-tertiary"> = ATL</span>
                <sub className="text-text-tertiary text-[9px]">yesterday</sub>
                <span className="text-text-tertiary"> + (TSS − ATL) × k</span>
                <sub className="text-orange-400/80 text-[9px]">7</sub>
              </div>
              <div>
                <span className="text-emerald-400">TSB</span>
                <span className="text-text-tertiary"> = CTL − ATL</span>
              </div>
              <div>
                <span className="text-purple-400">ACWR</span>
                <span className="text-text-tertiary"> = ATL ÷ CTL</span>
              </div>
            </div>
            <p className="text-text-tertiary text-[10px] pt-1 border-t border-border">
              k<sub>n</sub> = 1 − exp(−1/n) · TSS estimated from avg HR relative to max HR (HR-based TRIMP)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { label: 'Safe Ramp Rate', value: '+3 to +8 CTL/wk', detail: 'More than +8/wk correlates with overuse injury.', color: '#4ade80' },
              { label: 'Race-Ready TSB', value: '+10 to +25', detail: 'Target after a 10–14 day taper from peak load.', color: '#60a5fa' },
              { label: 'ACWR Safe Zone', value: '0.8 – 1.3', detail: 'Above 1.5 = elevated injury risk (Foster 2001).', color: '#fb923c' },
              { label: 'Detraining Risk', value: 'TSB > +30', detail: 'Extended rest reduces CTL. Plan a return-to-train block.', color: '#a78bfa' },
            ].map(({ label, value, detail, color }) => (
              <div key={label} className="rounded-lg border border-border p-3 text-xs space-y-1">
                <p className="font-semibold" style={{ color }}>{label}</p>
                <p className="font-mono font-bold text-text-primary text-sm">{value}</p>
                <p className="text-text-secondary leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <div className="pt-1 border-t border-border space-y-1 text-xs text-text-tertiary">
            <p className="font-medium text-text-secondary mb-1.5">References</p>
            <p>Bannister EW et al. (1991). Modeling elite athletic performance. <em>J Appl Physiol</em>.</p>
            <p>Busso T. (2003). Variable dose-response relationship between exercise training and performance. <em>Med Sci Sports Exerc</em>.</p>
            <p>Foster C et al. (2001). A new approach to monitoring exercise training. <em>J Strength Cond Res</em>.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
