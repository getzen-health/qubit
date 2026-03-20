'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { SleepNight } from './page'

interface SleepArchitectureClientProps {
  nights: SleepNight[]
}

// ─── Colour palette ────────────────────────────────────────────────────────────
const DEEP_COLOR  = '#4f46e5'   // indigo-600
const REM_COLOR   = '#7c3aed'   // violet-700 / purple
const CORE_COLOR  = '#3b82f6'   // blue-500

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

// ─── Custom donut centre label ─────────────────────────────────────────────────
interface CenterLabelProps {
  cx?: number
  cy?: number
  label: string
  sub: string
}
function CenterLabel({ cx = 0, cy = 0, label, sub }: CenterLabelProps) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--color-text-primary, #fff)" fontSize={18} fontWeight={700}>
        {label}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--color-text-secondary, #888)" fontSize={11}>
        {sub}
      </text>
    </g>
  )
}

export function SleepArchitectureClient({ nights }: SleepArchitectureClientProps) {
  // ─── Summary averages ────────────────────────────────────────────────────────
  const avgDeep       = Math.round(nights.reduce((s, n) => s + n.deep, 0) / nights.length)
  const avgREM        = Math.round(nights.reduce((s, n) => s + n.rem,  0) / nights.length)
  const avgCore       = Math.round(nights.reduce((s, n) => s + n.core, 0) / nights.length)
  const avgTotal      = Math.round(nights.reduce((s, n) => s + n.total,      0) / nights.length)
  const avgEfficiency = Math.round(nights.reduce((s, n) => s + n.efficiency, 0) / nights.length)

  const avgDeepPct  = Math.round((avgDeep  / avgTotal) * 100)
  const avgREMPct   = Math.round((avgREM   / avgTotal) * 100)
  const avgCorePct  = Math.round((avgCore  / avgTotal) * 100)

  // ─── Donut data ───────────────────────────────────────────────────────────────
  const donutData = [
    { name: 'Deep (SWS)', value: avgDeep,  color: DEEP_COLOR },
    { name: 'REM',        value: avgREM,   color: REM_COLOR  },
    { name: 'Core/Light', value: avgCore,  color: CORE_COLOR },
  ]

  // ─── Stacked bar: 30 nights ───────────────────────────────────────────────────
  // Thin the x-axis labels to every 5 nights for readability
  const stackedData = nights.map((n) => ({
    date:  n.date,
    Deep:  n.deep,
    REM:   n.rem,
    Core:  n.core,
  }))

  // ─── Deep sleep trend ─────────────────────────────────────────────────────────
  const deepTrendData = nights.map((n) => ({
    date:  n.date,
    deep:  n.deep,
  }))

  return (
    <div className="space-y-6">

      {/* ── Summary card ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'rgba(79,70,229,0.07)', borderColor: 'rgba(79,70,229,0.3)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🌙</span>
          <div>
            <p className="text-sm font-semibold text-text-primary">30-Night Average</p>
            <p className="text-xs text-text-secondary">Sleep architecture summary</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="bg-surface rounded-xl border border-border p-3 text-center sm:col-span-1">
            <p className="text-lg font-bold" style={{ color: DEEP_COLOR }}>{fmtMin(avgTotal)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Total</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold" style={{ color: DEEP_COLOR }}>{avgEfficiency}%</p>
            <p className="text-xs text-text-secondary mt-0.5">Efficiency</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold" style={{ color: REM_COLOR }}>{fmtMin(avgREM)}</p>
            <p className="text-xs text-text-secondary mt-0.5">REM · {avgREMPct}%</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold" style={{ color: CORE_COLOR }}>{fmtMin(avgCore)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Core · {avgCorePct}%</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3 text-center">
            <p className="text-lg font-bold" style={{ color: DEEP_COLOR }}>{fmtMin(avgDeep)}</p>
            <p className="text-xs text-text-secondary mt-0.5">Deep · {avgDeepPct}%</p>
          </div>
        </div>
      </div>

      {/* ── Stage donut ───────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Average Stage Composition</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-56 h-56 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <CenterLabel label={`${avgEfficiency}%`} sub="efficient" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [
                    `${fmtMin(v)} · ${Math.round((v / avgTotal) * 100)}%`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3 w-full">
            {[
              { label: 'Deep (SWS)', min: avgDeep,  pct: avgDeepPct,  color: DEEP_COLOR,  target: '15–20%' },
              { label: 'REM',        min: avgREM,   pct: avgREMPct,   color: REM_COLOR,   target: '20–25%' },
              { label: 'Core/Light', min: avgCore,  pct: avgCorePct,  color: CORE_COLOR,  target: '50–60%' },
            ].map(({ label, min, pct, color, target }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color }}>{label}</span>
                  <span className="text-text-secondary">{fmtMin(min)} · {pct}% <span className="opacity-50">(target {target})</span></span>
                </div>
                <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(pct * 1.5, 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 30-night stacked bar ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">
          30-Night Stage Breakdown (minutes)
        </h3>
        <div className="flex gap-4 mb-3 text-xs text-text-secondary">
          {[['Deep', DEEP_COLOR], ['REM', REM_COLOR], ['Core/Light', CORE_COLOR]].map(([name, color]) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color as string }} />
              {name}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stackedData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={28}
              tickFormatter={(v) => `${Math.round(v / 60)}h`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [fmtMin(v), name]}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="Core" stackId="a" fill={CORE_COLOR} />
            <Bar dataKey="REM"  stackId="a" fill={REM_COLOR} />
            <Bar dataKey="Deep" stackId="a" fill={DEEP_COLOR} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Deep sleep trend ──────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-1">Deep Sleep Trend</h3>
        <p className="text-xs text-text-secondary mb-3 opacity-70">
          Dashed line = 90-min target (WHO / Walker 2017)
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={deepTrendData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 130]}
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              width={28}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [fmtMin(v), 'Deep Sleep']}
            />
            <ReferenceLine
              y={90}
              stroke={`${DEEP_COLOR}80`}
              strokeDasharray="5 4"
              label={{ value: '90min target', position: 'insideTopRight', fontSize: 10, fill: `${DEEP_COLOR}cc` }}
            />
            <Line
              type="monotone"
              dataKey="deep"
              name="Deep Sleep"
              stroke={DEEP_COLOR}
              strokeWidth={2}
              dot={{ r: 2.5, fill: DEEP_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Science card ──────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 text-xs text-text-secondary space-y-4">
        <p className="text-sm font-semibold text-text-primary">The Science of Sleep Stages</p>

        <div className="space-y-3">
          <div>
            <p className="font-medium mb-0.5" style={{ color: DEEP_COLOR }}>Deep Sleep (SWS — Slow-Wave Sleep)</p>
            <p className="opacity-75 leading-relaxed">
              Concentrated in the first 2 sleep cycles (hours 1–4). This is the most physically
              restorative stage: growth hormone is released, muscles and tissues repair, and the
              immune system is strengthened. Deep sleep diminishes sharply with alcohol, irregular
              sleep timing, and ageing. Target: <strong className="text-text-primary opacity-90">15–20% of total sleep</strong>.
            </p>
          </div>

          <div>
            <p className="font-medium mb-0.5" style={{ color: REM_COLOR }}>REM Sleep (Rapid Eye Movement)</p>
            <p className="opacity-75 leading-relaxed">
              REM cycles lengthen toward morning (hours 6–8), making early alarms particularly
              costly. REM supports memory consolidation, emotional regulation, and creative
              problem-solving. Cutting sleep short disproportionately eliminates REM.
              Target: <strong className="text-text-primary opacity-90">20–25% of total sleep</strong>.
            </p>
          </div>

          <div>
            <p className="font-medium mb-0.5" style={{ color: CORE_COLOR }}>Core / Light Sleep (N1 + N2)</p>
            <p className="opacity-75 leading-relaxed">
              The transitional fabric of the night. Sleep spindles during N2 play a role in
              motor learning and declarative memory. Though labelled "light", it is neither
              wasteful nor optional — it makes up the largest proportion of a healthy night.
              Target: <strong className="text-text-primary opacity-90">50–60% of total sleep</strong>.
            </p>
          </div>

          <div className="pt-1 border-t border-border">
            <p className="font-medium mb-1 text-text-primary opacity-80">Target Percentages</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'REM',        range: '20–25%', color: REM_COLOR  },
                { label: 'Deep (SWS)', range: '15–20%', color: DEEP_COLOR },
                { label: 'Core/Light', range: '50–60%', color: CORE_COLOR },
              ].map(({ label, range, color }) => (
                <div
                  key={label}
                  className="rounded-lg p-2 text-center"
                  style={{ background: `${color}12`, borderWidth: 1, borderStyle: 'solid', borderColor: `${color}30` }}
                >
                  <p className="font-semibold" style={{ color }}>{range}</p>
                  <p className="opacity-70 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="opacity-40 pt-1 border-t border-border">
          Source: Walker, M. (2017). <em>Why We Sleep</em>. Scribner. Sleep stage percentages based on
          polysomnography norms in healthy adults aged 18–64.
        </p>
      </div>

    </div>
  )
}
